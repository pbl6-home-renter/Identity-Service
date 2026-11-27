import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Audited } from 'modules/audit/application/audited.decorator';
import { EmailSendRequestedEvent } from 'modules/auth/application/events/email-send-requested.event';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { AppealNotFoundException } from '../../../domain/exceptions/appeal-not-found.exception';
import { IAccountAppealRepository } from '../../../domain/repositories/account-appeal.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { ModerationEmailComposerPort } from '../../ports/moderation-email-composer.port';
import { AppealAcceptCommand } from './appeal-accept.command';

export interface AppealAcceptResult {
  appeal: AccountAppeal;
  /** False when the account had already been unlocked; the appeal is only closed. */
  unlocked: boolean;
}

/** Accepting an appeal unlocks the account in the same transaction (P13-D109). */
@CommandHandler(AppealAcceptCommand)
export class AppealAcceptCommandHandler implements ICommandHandler<
  AppealAcceptCommand,
  AppealAcceptResult
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.APPEAL_REPOSITORY)
    private readonly appealRepository: IAccountAppealRepository,
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(MODERATION_DI_TOKEN.EMAIL_COMPOSER)
    private readonly emailComposer: ModerationEmailComposerPort,
  ) {}

  @Audited<AppealAcceptCommand, AppealAcceptResult>({
    action: 'user.unlocked',
    entityType: 'user',
    actorId: (command) => command.adminId,
    entityId: (_command, result) => result.appeal.userId,
    metadata: (_command, result) => ({ appealId: result.appeal.id }),
    skipIf: (_command, result) => !result.unlocked,
  })
  async execute(command: AppealAcceptCommand): Promise<AppealAcceptResult> {
    return this.unitOfWork.run(async (context) => {
      const appeal = await this.appealRepository.findByIdForUpdate(
        command.appealId,
        context,
      );
      if (!appeal) throw new AppealNotFoundException();

      const user = await this.userRepository.findByIdForUpdate(
        appeal.userId,
        context,
      );
      if (!user) throw new UserNotFoundException();

      appeal.accept(command.adminId);
      await this.appealRepository.save(appeal, context);

      // Only unlock the lock period this appeal was written for.
      const unlocked =
        user.status === UserStatus.LOCKED &&
        user.lockedAt?.getTime() === appeal.lockedAt.getTime();
      if (!unlocked) {
        return { appeal, unlocked };
      }

      const lockedAt = user.lockedAt!;
      const unlockedAt = new Date();
      user.unlock(unlockedAt);
      await this.userRepository.save(user, context);
      await this.userRepository.recordUnlockPeriod(
        user.id,
        lockedAt,
        unlockedAt,
        context,
      );

      const email = this.emailComposer.appealAccepted({ name: user.name });
      await this.outboxRepository.append(
        [
          ...user.pullDomainEvents(),
          new EmailSendRequestedEvent(
            user.email.value,
            email.subject,
            email.text,
            email.html,
          ),
        ].map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
      return { appeal, unlocked };
    });
  }
}
