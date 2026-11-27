import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { UserReport } from '../../domain/entities/user-report';
import { UserReportStatus } from '../../domain/enums/user-report-status.enum';
import { ReportAlreadyPendingException } from '../../domain/exceptions/report-already-pending.exception';
import { IUserReportRepository } from '../../domain/repositories/user-report.repository.interface';
import { UserReportEntity } from './user-report.typeorm-entity';
import { UserReportMapper } from './mappers/user-report.mapper';
import { isUniqueViolation } from './unique-violation';

@Injectable()
export class UserReportRepository implements IUserReportRepository {
  constructor(
    @InjectRepository(UserReportEntity)
    private readonly repository: Repository<UserReportEntity>,
  ) {}

  async save(report: UserReport, context?: TransactionContext): Promise<void> {
    try {
      await withTransaction(this.repository, context).save(
        UserReportMapper.toPersistence(report),
      );
    } catch (error) {
      if (isUniqueViolation(error, 'UQ_user_reports_pending_pair')) {
        throw new ReportAlreadyPendingException();
      }
      throw error;
    }
  }

  async findById(id: Uuid): Promise<UserReport | null> {
    const raw = await this.repository.findOneBy({ id, isDeleted: false });
    return raw ? UserReportMapper.toDomain(raw) : null;
  }

  async findByIdForUpdate(
    id: Uuid,
    context: TransactionContext,
  ): Promise<UserReport | null> {
    const raw = await withTransaction(this.repository, context).findOne({
      where: { id, isDeleted: false },
      lock: { mode: 'pessimistic_write' },
    });
    return raw ? UserReportMapper.toDomain(raw) : null;
  }

  hasPending(reporterId: Uuid, reportedUserId: Uuid): Promise<boolean> {
    return this.repository.existsBy({
      reporterId,
      reportedUserId,
      status: UserReportStatus.PENDING,
      isDeleted: false,
    });
  }

  async findPendingByReportedUser(
    reportedUserId: Uuid,
    context: TransactionContext,
  ): Promise<UserReport[]> {
    const rows = await withTransaction(this.repository, context).find({
      where: {
        reportedUserId,
        status: UserReportStatus.PENDING,
        isDeleted: false,
      },
      lock: { mode: 'pessimistic_write' },
    });
    return rows.map((row) => UserReportMapper.toDomain(row));
  }
}
