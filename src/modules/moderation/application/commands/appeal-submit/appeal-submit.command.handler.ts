import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { AccountNotLockedException } from '../../../domain/exceptions/account-not-locked.exception';
import { IAccountAppealRepository } from '../../../domain/repositories/account-appeal.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { ModerationAttachmentService } from '../../services/moderation-attachment.service';
import { AppealSubmitCommand } from './appeal-submit.command';

/** P13-D109: a locked user sends one appeal at a time, then waits 7 days after a rejection. */
@CommandHandler(AppealSubmitCommand)
export class AppealSubmitCommandHandler implements ICommandHandler<
  AppealSubmitCommand,
  AccountAppeal
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MODERATION_DI_TOKEN.APPEAL_REPOSITORY)
    private readonly appealRepository: IAccountAppealRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    private readonly attachments: ModerationAttachmentService,
  ) {}

  async execute(command: AppealSubmitCommand): Promise<AccountAppeal> {
    await this.attachments.assertOwnUploads(
      command.userId,
      command.attachmentMediaIds,
      MediaPurpose.APPEAL_ATTACHMENT,
    );

    return this.unitOfWork.run(async (context) => {
      // Locking the user row serializes concurrent submissions of one user.
      const user = await this.userRepository.findByIdForUpdate(
        command.userId,
        context,
      );
      if (!user) throw new UserNotFoundException();
      if (user.status !== UserStatus.LOCKED || !user.lockedAt) {
        throw new AccountNotLockedException();
      }

      const latest = await this.appealRepository.findLatestForLockPeriod(
        user.id,
        user.lockedAt,
        context,
      );
      const appeal = AccountAppeal.submit(
        {
          userId: user.id,
          lockedAt: user.lockedAt,
          lockReason: user.lockReason,
          content: command.content,
          attachmentMediaIds: command.attachmentMediaIds,
          contactEmail: command.contactEmail,
          contactPhone: command.contactPhone,
        },
        latest,
      );
      await this.appealRepository.save(appeal, context);
      return appeal;
    });
  }
}
