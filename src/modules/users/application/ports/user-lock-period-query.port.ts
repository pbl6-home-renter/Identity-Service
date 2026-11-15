import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface UserLockPeriodSnapshot {
  lockedAt: Date;
  unlockedAt: Date | null;
}

export interface UserLockPeriodQueryPort {
  findLockPeriod(
    userId: Uuid,
    lockedAt: Date,
    context: TransactionContext,
  ): Promise<UserLockPeriodSnapshot | null>;
  findLatestLockTime(
    userId: Uuid,
    context: TransactionContext,
  ): Promise<Date | null>;
}
