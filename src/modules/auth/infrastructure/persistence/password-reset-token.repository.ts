import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetTokenEntity } from './password-reset-token.typeorm-entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token';
import { PasswordResetTokenMapper } from './mappers/password-reset-token.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  async save(
    passwordResetToken: PasswordResetToken,
    context?: TransactionContext,
  ): Promise<void> {
    if (context) {
      await this.replace(
        withTransaction(this.repository, context).manager,
        passwordResetToken,
      );
      return;
    }

    await this.repository.manager.transaction((manager) =>
      this.replace(manager, passwordResetToken),
    );
  }

  private async replace(
    manager: EntityManager,
    passwordResetToken: PasswordResetToken,
  ): Promise<void> {
    await manager.delete(PasswordResetTokenEntity, {
      userId: passwordResetToken.userId,
    });
    await manager.save(
      PasswordResetTokenMapper.toPersistence(passwordResetToken),
    );
  }

  async findById(id: Uuid): Promise<PasswordResetToken | null> {
    const record = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    return record ? PasswordResetTokenMapper.toDomain(record) : null;
  }

  async delete(id: Uuid): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }
}
