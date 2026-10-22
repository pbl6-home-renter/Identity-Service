import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from 'shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from 'shared/domain/pagination/i-pagination.response.dto';
import { TypeOrmPaginator } from 'shared/infra/typeorm/pagination/typeorm.paginator';
import { PostgresErrorCode } from 'shared/infra/typeorm/constants/postgres-error-code.constant';
import { EmailAlreadyExistsException } from 'modules/users/domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from 'modules/users/domain/exceptions/phone-already-exists.exception';
import { User } from '../../domain/entities/user';
import { UserDeleteAlreadyDeletedException } from '../../domain/exceptions/user-delete-already-deleted.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from './user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    try {
      const raw = UserMapper.toPersistence(user);
      await this.repository.save(raw);
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

  async updatePassword(userId: Uuid, newHashedPassword: string): Promise<void> {
    await this.repository.update(userId, {
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

  async findAll(): Promise<User[]> {
    const records = await this.repository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return records.map((r) => UserMapper.toDomain(r));
  }

  async findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<User>> {
    const qb = this.repository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false });

    return TypeOrmPaginator.offset(qb, options)
      .withSort({
        whitelist: ['createdAt', 'name', 'email', 'phone'],
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
        alias: 'user',
      })
      .paginate((raw) => UserMapper.toDomain(raw));
  }

  async delete(id: Uuid): Promise<void> {
    const user = await this.repository.findOne({
      where: { id },
    });
    if (!user) throw new UserNotFoundException();
    if (user.isDeleted) throw new UserDeleteAlreadyDeletedException();

    await this.repository.update(id, {
      isDeleted: true,
    });
  }
}
