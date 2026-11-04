import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OffsetPageQuery } from 'shared/application/pagination/offset-page-query';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { User } from '../../domain/entities/user';
import { GetMeUserModel } from '../queries/models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../queries/models/get-users-admin-filter.model';
import { UserDirectoryEntryModel } from '../queries/models/user-directory-entry.model';

export interface UserDirectorySearch {
  readonly callerUserId: Uuid;
  readonly searchKeyword: string;
  readonly pageNo: number;
  readonly pageSize: number;
}

export interface IUserQueryService {
  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;

  findByIdsIncludingDeleted(userIds: Uuid[]): Promise<User[]>;

  findUsersAdmin(
    options: OffsetPageQuery<GetUsersAdminFilterModel>,
  ): Promise<PaginatedResult<User>>;

  /** Active landlords/tenants other than the caller whose name matches the keyword. */
  findDirectoryUsers(
    search: UserDirectorySearch,
  ): Promise<PaginatedResult<UserDirectoryEntryModel>>;
}
