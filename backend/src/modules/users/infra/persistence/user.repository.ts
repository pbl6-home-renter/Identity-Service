import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user';
import { UserEntity } from './user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from 'shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from 'shared/domain/pagination/i-pagination.response.dto';
import { TypeOrmPaginator } from 'shared/infra/typeorm/pagination/typeorm.paginator';

@Injectable()
export class UserPostgresRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const raw = UserMapper.toPersistence(user);
    await this.repository.save(raw);
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

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { email, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { phone, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const raw = await this.repository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(user.email = :identifier OR user.phone = :identifier)', {
        identifier,
      })
      .getOne();

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
    await this.repository.update(id, { isDeleted: true });
  }
}
