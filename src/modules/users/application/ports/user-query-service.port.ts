import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OffsetPageQuery } from 'shared/application/pagination/offset-page-query';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { User } from '../../domain/entities/user';
import { GetMeUserModel } from '../queries/models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../queries/models/get-users-admin-filter.model';

export interface IUserQueryService {
  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;
  findUsersAdmin(
    options: OffsetPageQuery<GetUsersAdminFilterModel>,
  ): Promise<PaginatedResult<User>>;
}
