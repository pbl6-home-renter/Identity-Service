import { UserLockPeriodGetInternalQuery } from 'modules/users/application/queries/user-lock-period-get-internal/user-lock-period-get-internal.query';
import { UserLockPeriodGetInternalQueryHandler } from 'modules/users/application/queries/user-lock-period-get-internal/user-lock-period-get-internal.query.handler';
import { UserLockPeriodQueryPort } from 'modules/users/application/ports/user-lock-period-query.port';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

const lockedAt = new Date('2026-11-14T00:00:00.000Z');

function setup(status = UserStatus.ACTIVE) {
  const userId = generateUuid();
  const context: TransactionContext = { kind: 'transaction' };
  const unitOfWork: IUnitOfWork = {
    run: jest.fn(async (work) => work(context)),
  };
  const user = {
    status,
    lockedAt: status === UserStatus.LOCKED ? lockedAt : null,
  };
  const users = { findByIdForUpdate: jest.fn(async () => user) };
  const periods = {
    findLockPeriod: jest.fn(),
    findLatestLockTime: jest.fn(async () => lockedAt),
  };
  const handler = new UserLockPeriodGetInternalQueryHandler(
    users as unknown as IUserRepository,
    periods as UserLockPeriodQueryPort,
    unitOfWork,
  );
  return {
    handler,
    users,
    periods,
    context,
    query: new UserLockPeriodGetInternalQuery(userId, lockedAt),
  };
}

describe('Identity lock-period evidence', () => {
  it('returns the historical unlock time even after a later lock', async () => {
    const s = setup(UserStatus.LOCKED);
    const unlockedAt = new Date(lockedAt.getTime() + 59_000);
    const later = new Date(lockedAt.getTime() + 120_000);
    s.periods.findLockPeriod.mockResolvedValue({ lockedAt, unlockedAt });
    s.periods.findLatestLockTime.mockResolvedValue(later);
    const result = await s.handler.execute(s.query);
    expect(result).toMatchObject({
      state: 'unlocked',
      unlockedAt: unlockedAt.toISOString(),
      latestLockedAt: later.toISOString(),
    });
    expect(s.users.findByIdForUpdate).toHaveBeenCalledWith(
      s.query.userId,
      s.context,
    );
    expect(s.periods.findLockPeriod).toHaveBeenCalledWith(
      s.query.userId,
      lockedAt,
      s.context,
    );
  });

  it('keeps missing historical unlock evidence unknown for an active account', async () => {
    const s = setup();
    s.periods.findLockPeriod.mockResolvedValue(null);
    expect(await s.handler.execute(s.query)).toMatchObject({
      state: 'unknown',
      unlockedAt: null,
    });
  });

  it('recognizes the exact currently locked period for a legacy account', async () => {
    const s = setup(UserStatus.LOCKED);
    s.periods.findLockPeriod.mockResolvedValue(null);
    expect(await s.handler.execute(s.query)).toMatchObject({
      state: 'locked',
      lockedAt: lockedAt.toISOString(),
    });
  });
});
