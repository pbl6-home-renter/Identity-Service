import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from 'shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from 'shared/domain/pagination/i-pagination.response.dto';
import { TypeOrmPaginator } from 'shared/infra/typeorm/pagination/typeorm.paginator';

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

  async findAll(): Promise<PasswordResetToken[]> {
    const records = await this.repository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return records.map((record) => PasswordResetTokenMapper.toDomain(record));
  }

  async findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<PasswordResetToken>> {
    const queryBuilder = this.repository
      .createQueryBuilder('passwordResetToken')
      .where('passwordResetToken.isDeleted = :isDeleted', {
        isDeleted: false,
      });

    return TypeOrmPaginator.offset(queryBuilder, options)
      .withSort({
        whitelist: ['createdAt', 'expiresAt'],
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
        alias: 'passwordResetToken',
      })
      .paginate((record) => PasswordResetTokenMapper.toDomain(record));
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
