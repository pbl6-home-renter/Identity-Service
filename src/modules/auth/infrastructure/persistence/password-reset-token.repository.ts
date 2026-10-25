import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetTokenEntity } from './password-reset-token.typeorm-entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token';
import { PasswordResetTokenMapper } from './mappers/password-reset-token.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  async save(passwordResetToken: PasswordResetToken): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(PasswordResetTokenEntity, {
        userId: passwordResetToken.userId,
      });
      await manager.save(
        PasswordResetTokenMapper.toPersistence(passwordResetToken),
      );
    });
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
