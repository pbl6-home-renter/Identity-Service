import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserLockPeriodQueryPort } from '../../ports/user-lock-period-query.port';
import { UserLockPeriodGetInternalQuery } from './user-lock-period-get-internal.query';
import { UserLockPeriodGetInternalResult } from './user-lock-period-get-internal.result';

@QueryHandler(UserLockPeriodGetInternalQuery)
export class UserLockPeriodGetInternalQueryHandler implements IQueryHandler<
  UserLockPeriodGetInternalQuery,
  UserLockPeriodGetInternalResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY) private readonly users: IUserRepository,
    @Inject(USERS_DI_TOKEN.LOCK_PERIOD_QUERY)
    private readonly periods: UserLockPeriodQueryPort,
    @Inject(UNIT_OF_WORK_DI_TOKEN) private readonly unitOfWork: IUnitOfWork,
  ) {}

  execute(
    query: UserLockPeriodGetInternalQuery,
  ): Promise<UserLockPeriodGetInternalResult> {
    return this.unitOfWork.run(async (context) => {
      // Serialize this proof with lock/unlock writes, including uncommitted unlocks.
      const user = await this.users.findByIdForUpdate(query.userId, context);
      if (!user) throw new UserNotFoundException();
      const period = await this.periods.findLockPeriod(
        query.userId,
        query.lockedAt,
        context,
      );
      const latest = await this.periods.findLatestLockTime(
        query.userId,
        context,
      );
      const stillLocked =
        user.status === UserStatus.LOCKED &&
        user.lockedAt?.getTime() === query.lockedAt.getTime();
      const latestLockedAt = Math.max(
        latest?.getTime() ?? 0,
        user.lockedAt?.getTime() ?? 0,
      );
      return {
        lockedAt: query.lockedAt.toISOString(),
        unlockedAt: period?.unlockedAt?.toISOString() ?? null,
        latestLockedAt: latestLockedAt
          ? new Date(latestLockedAt).toISOString()
          : null,
        observedAt: new Date().toISOString(),
        state: period?.unlockedAt
          ? 'unlocked'
          : stillLocked
            ? 'locked'
            : 'unknown',
      };
    });
  }
}
