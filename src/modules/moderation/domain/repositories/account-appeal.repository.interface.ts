import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AccountAppeal } from '../entities/account-appeal';

export interface IAccountAppealRepository {
  save(appeal: AccountAppeal, context?: TransactionContext): Promise<void>;
  findById(id: Uuid): Promise<AccountAppeal | null>;
  findByIdForUpdate(
    id: Uuid,
    context: TransactionContext,
  ): Promise<AccountAppeal | null>;
  /** Newest appeal of one lock period. */
  findLatestForLockPeriod(
    userId: Uuid,
    lockedAt: Date,
    context?: TransactionContext,
  ): Promise<AccountAppeal | null>;
  findPendingByUser(
    userId: Uuid,
    context: TransactionContext,
  ): Promise<AccountAppeal[]>;
}
