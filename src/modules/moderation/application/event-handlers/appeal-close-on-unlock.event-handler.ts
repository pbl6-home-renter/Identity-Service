import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserUnlockedByAdminEvent } from 'modules/users/application/events/user-unlocked-by-admin.event';
import { IAccountAppealRepository } from '../../domain/repositories/account-appeal.repository.interface';
import { MODERATION_DI_TOKEN } from '../../moderation.di-token';

/** A direct unlock answers the pending appeal too (P13-D109). Best effort. */
@EventsHandler(UserUnlockedByAdminEvent)
export class AppealCloseOnUnlockEventHandler implements IEventHandler<UserUnlockedByAdminEvent> {
  private readonly logger = new Logger(AppealCloseOnUnlockEventHandler.name);

  constructor(
    @Inject(MODERATION_DI_TOKEN.APPEAL_REPOSITORY)
    private readonly appealRepository: IAccountAppealRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async handle(event: UserUnlockedByAdminEvent): Promise<void> {
    try {
      await this.unitOfWork.run(async (context) => {
        const pending = await this.appealRepository.findPendingByUser(
          event.userId,
          context,
        );
        for (const appeal of pending) {
          appeal.accept(event.adminId);
          await this.appealRepository.save(appeal, context);
        }
      });
    } catch (error) {
      this.logger.error(
        `Could not close pending appeals of user ${event.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
