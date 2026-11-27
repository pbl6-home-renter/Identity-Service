import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OffsetPageQuery } from 'shared/application/pagination/offset-page-query';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';
import { GetMeUserModel } from '../queries/models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../queries/models/get-users-admin-filter.model';
import { UserDirectoryEntryModel } from '../queries/models/user-directory-entry.model';

export interface UserCountByRoleAndStatus {
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly count: number;
}

export interface UserDirectorySearch {
  readonly callerUserId: Uuid;
  readonly searchKeyword: string | null;
  readonly pageNo: number;
  readonly pageSize: number;
}

export interface IUserQueryService {
  findActiveAdminIds(): Promise<Uuid[]>;

  /** Counts all user rows, including soft-deleted accounts. */
  countUsersByRoleAndStatus(): Promise<UserCountByRoleAndStatus[]>;

  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;

  findByIdsIncludingDeleted(userIds: Uuid[]): Promise<User[]>;

  findUsersAdmin(
    options: OffsetPageQuery<GetUsersAdminFilterModel>,
  ): Promise<PaginatedResult<User>>;

  /** Active landlords/tenants other than the caller, optionally filtered by name. */
  findDirectoryUsers(
    search: UserDirectorySearch,
  ): Promise<PaginatedResult<UserDirectoryEntryModel>>;
}
