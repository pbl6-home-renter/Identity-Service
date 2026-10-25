import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OffsetPageQuery } from 'shared/application/pagination/offset-page-query';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { TypeOrmPaginator } from 'shared/infrastructure/database/pagination/typeorm.paginator';
import { LandlordProfileMapper } from 'modules/landlord-profiles/infrastructure/persistence/mappers/landlord-profile.mapper';
import { User } from '../../domain/entities/user';
import { IUserQueryService } from '../../application/ports/user-query-service.port';
import { GetMeUserModel } from '../../application/queries/models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../../application/queries/models/get-users-admin-filter.model';
import { UserEntity } from '../persistence/user.typeorm-entity';
import { UserMapper } from '../persistence/mappers/user.mapper';

@Injectable()
export class UserQueryService implements IUserQueryService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findByUserId(id: Uuid): Promise<GetMeUserModel | null> {
    const raw = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.landlordProfile',
        'landlordProfile',
        'landlordProfile.is_deleted = :profileIsDeleted',
        { profileIsDeleted: false },
      )
      .where('user.id = :id', { id })
      .andWhere('user.is_deleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!raw) {
      return null;
    }

    return {
      user: UserMapper.toDomain(raw),
      landlordProfile: raw.landlordProfile
        ? LandlordProfileMapper.toDomain(raw.landlordProfile)
        : null,
    };
  }

  async findUsersAdmin(
    options: OffsetPageQuery<GetUsersAdminFilterModel>,
  ): Promise<PaginatedResult<User>> {
    const qb = this.repository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false });

    if (options.filter?.role) {
      qb.andWhere('user.role = :role', { role: options.filter.role });
    }

    if (options.filter?.status) {
      qb.andWhere('user.status = :status', { status: options.filter.status });
    }

    if (
      options.filter?.searchKeyword &&
      options.filter.searchKeyword.trim().length > 0
    ) {
      const q = `%${options.filter.searchKeyword.trim().toLowerCase()}%`;
      const rawQ = `%${options.filter.searchKeyword.trim()}%`;
      qb.andWhere(
        '(LOWER(user.name) LIKE :q OR LOWER(user.email) LIKE :q OR user.phone LIKE :rawQ)',
        { q, rawQ },
      );
    }

    return TypeOrmPaginator.offset(qb, options)
      .withSort({
        whitelist: ['createdAt', 'name', 'role', 'status'],
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
        alias: 'user',
      })
      .paginate((raw) => UserMapper.toDomain(raw));
  }
}
