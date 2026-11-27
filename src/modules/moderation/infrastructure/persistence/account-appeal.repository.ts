import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { AccountAppeal } from '../../domain/entities/account-appeal';
import { AccountAppealStatus } from '../../domain/enums/account-appeal-status.enum';
import { AppealAlreadyPendingException } from '../../domain/exceptions/appeal-already-pending.exception';
import { IAccountAppealRepository } from '../../domain/repositories/account-appeal.repository.interface';
import { AccountAppealEntity } from './account-appeal.typeorm-entity';
import { AccountAppealMapper } from './mappers/account-appeal.mapper';
import { isUniqueViolation } from './unique-violation';

@Injectable()
export class AccountAppealRepository implements IAccountAppealRepository {
  constructor(
    @InjectRepository(AccountAppealEntity)
    private readonly repository: Repository<AccountAppealEntity>,
  ) {}

  async save(
    appeal: AccountAppeal,
    context?: TransactionContext,
  ): Promise<void> {
    try {
      await withTransaction(this.repository, context).save(
        AccountAppealMapper.toPersistence(appeal),
      );
    } catch (error) {
      if (isUniqueViolation(error, 'UQ_account_appeals_user_pending')) {
        throw new AppealAlreadyPendingException();
      }
      throw error;
    }
  }

  async findById(id: Uuid): Promise<AccountAppeal | null> {
    const raw = await this.repository.findOneBy({ id, isDeleted: false });
    return raw ? AccountAppealMapper.toDomain(raw) : null;
  }

  async findByIdForUpdate(
    id: Uuid,
    context: TransactionContext,
  ): Promise<AccountAppeal | null> {
    const raw = await withTransaction(this.repository, context).findOne({
      where: { id, isDeleted: false },
      lock: { mode: 'pessimistic_write' },
    });
    return raw ? AccountAppealMapper.toDomain(raw) : null;
  }

  async findLatestForLockPeriod(
    userId: Uuid,
    lockedAt: Date,
    context?: TransactionContext,
  ): Promise<AccountAppeal | null> {
    const raw = await withTransaction(this.repository, context).findOne({
      where: { userId, lockedAt, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return raw ? AccountAppealMapper.toDomain(raw) : null;
  }

  async findPendingByUser(
    userId: Uuid,
    context: TransactionContext,
  ): Promise<AccountAppeal[]> {
    const rows = await withTransaction(this.repository, context).find({
      where: { userId, status: AccountAppealStatus.PENDING, isDeleted: false },
      lock: { mode: 'pessimistic_write' },
    });
    return rows.map((row) => AccountAppealMapper.toDomain(row));
  }
}
