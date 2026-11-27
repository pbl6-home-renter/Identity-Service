import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReport } from '../entities/user-report';

export interface IUserReportRepository {
  save(report: UserReport, context?: TransactionContext): Promise<void>;
  findById(id: Uuid): Promise<UserReport | null>;
  findByIdForUpdate(
    id: Uuid,
    context: TransactionContext,
  ): Promise<UserReport | null>;
  hasPending(reporterId: Uuid, reportedUserId: Uuid): Promise<boolean>;
  findPendingByReportedUser(
    reportedUserId: Uuid,
    context: TransactionContext,
  ): Promise<UserReport[]>;
}
