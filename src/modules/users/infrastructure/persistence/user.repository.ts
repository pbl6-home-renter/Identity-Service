import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PostgresErrorCode } from 'shared/infrastructure/database/postgres-error-code';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { EmailAlreadyExistsException } from '../../domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from '../../domain/exceptions/phone-already-exists.exception';
import { User } from '../../domain/entities/user';
import { UserDeleteAlreadyDeletedException } from '../../domain/exceptions/user-delete-already-deleted.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from './user.typeorm-entity';
import { UserMapper } from './mappers/user.mapper';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(user: User, context?: TransactionContext): Promise<void> {
    try {
      const raw = UserMapper.toPersistence(user);
      await withTransaction(this.repository, context).save(raw);
    } catch (error) {
      const pgError = (
        error as {
          driverError?: {
            code?: string;
            constraint?: string;
            detail?: string;
          };
        }
      )?.driverError;

      if (pgError?.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        const text =
          `${pgError.constraint ?? ''} ${pgError.detail ?? ''}`.toLowerCase();

        if (text.includes('phone')) {
          throw new PhoneAlreadyExistsException(user.phone.value);
        }
        if (text.includes('email')) {
          throw new EmailAlreadyExistsException(user.email.value);
        }
      }

      throw error;
    }
  }

  async updatePassword(
    userId: Uuid,
    newHashedPassword: string,
    context?: TransactionContext,
  ): Promise<void> {
    await withTransaction(this.repository, context).update(userId, {
      password: newHashedPassword,
    });
  }

  async findById(id: Uuid): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByIdIncludingDeleted(id: Uuid): Promise<User | null> {
    const raw = await this.repository.findOne({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { email: email.value, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByPhone(phone: Phone): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { phone: phone.value, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async delete(id: Uuid, context?: TransactionContext): Promise<void> {
    const repository = withTransaction(this.repository, context);
    const user = await repository.findOne({
      where: { id },
    });
    if (!user) throw new UserNotFoundException();
    if (user.isDeleted) throw new UserDeleteAlreadyDeletedException();

    await repository.update(id, {
      isDeleted: true,
    });
  }
}
