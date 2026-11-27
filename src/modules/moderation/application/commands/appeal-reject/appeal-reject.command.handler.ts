import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { Audited } from 'modules/audit/application/audited.decorator';
import { EmailSendRequestedEvent } from 'modules/auth/application/events/email-send-requested.event';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { AppealNotFoundException } from '../../../domain/exceptions/appeal-not-found.exception';
import { IAccountAppealRepository } from '../../../domain/repositories/account-appeal.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { ModerationEmailComposerPort } from '../../ports/moderation-email-composer.port';
import { AppealRejectCommand } from './appeal-reject.command';

@CommandHandler(AppealRejectCommand)
export class AppealRejectCommandHandler implements ICommandHandler<
  AppealRejectCommand,
  AccountAppeal
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

  @Audited<AppealRejectCommand, AccountAppeal>({
    action: 'appeal.rejected',
    entityType: 'user',
    actorId: (command) => command.adminId,
    entityId: (_command, appeal) => appeal.userId,
    metadata: (command, appeal) => ({
      appealId: appeal.id,
      rejectReason: command.rejectReason,
    }),
  })
  async execute(command: AppealRejectCommand): Promise<AccountAppeal> {
    return this.unitOfWork.run(async (context) => {
      const appeal = await this.appealRepository.findByIdForUpdate(
        command.appealId,
        context,
      );
      if (!appeal) throw new AppealNotFoundException();

      appeal.reject(command.adminId, command.rejectReason);
      await this.appealRepository.save(appeal, context);

      const events = [...appeal.pullDomainEvents()];
      const user = await this.userRepository.findById(appeal.userId);
      const nextSubmitAt = AccountAppeal.nextSubmitAt(appeal);
      if (user && nextSubmitAt) {
        const email = this.emailComposer.appealRejected({
          name: user.name,
          rejectReason: command.rejectReason,
          nextSubmitAt,
        });
        events.push(
          new EmailSendRequestedEvent(
            user.email.value,
            email.subject,
            email.text,
            email.html,
          ),
        );
      }
      await this.outboxRepository.append(
        events.map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
      return appeal;
    });
  }
}
