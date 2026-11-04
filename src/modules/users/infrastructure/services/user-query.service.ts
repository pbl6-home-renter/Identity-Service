import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OffsetPageQuery } from 'shared/application/pagination/offset-page-query';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { TypeOrmPaginator } from 'shared/infrastructure/database/pagination/typeorm.paginator';
import { LandlordProfileMapper } from 'modules/landlord-profiles/infrastructure/persistence/mappers/landlord-profile.mapper';
import { User } from '../../domain/entities/user';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import {
  IUserQueryService,
  UserDirectorySearch,
} from '../../application/ports/user-query-service.port';
import { UserDirectoryEntryModel } from '../../application/queries/models/user-directory-entry.model';
import { GetMeUserModel } from '../../application/queries/models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../../application/queries/models/get-users-admin-filter.model';
import { UserEntity } from '../persistence/user.typeorm-entity';
import { UserMapper } from '../persistence/mappers/user.mapper';
import {
  containsLikePattern,
  foldVietnameseSql,
} from '../persistence/vietnamese-search.sql';

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

  async findByIdsIncludingDeleted(ids: Uuid[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    const raws = await this.repository.find({ where: { id: In(ids) } });
    return raws.map((raw) => UserMapper.toDomain(raw));
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

  async findDirectoryUsers(
    search: UserDirectorySearch,
  ): Promise<PaginatedResult<UserDirectoryEntryModel>> {
    const qb = this.repository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name'])
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.role IN (:...roles)', {
        roles: [UserRole.LANDLORD, UserRole.TENANT],
      })
      .andWhere('user.id <> :callerUserId', {
        callerUserId: search.callerUserId,
      })
      .andWhere(
        `${foldVietnameseSql('user.name')} LIKE ${foldVietnameseSql(':namePattern')}`,
        { namePattern: containsLikePattern(search.searchKeyword) },
      )
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.id', 'ASC');

    return TypeOrmPaginator.offset(qb, search).paginate((raw) => ({
      id: raw.id,
      name: raw.name,
    }));
  }
}
