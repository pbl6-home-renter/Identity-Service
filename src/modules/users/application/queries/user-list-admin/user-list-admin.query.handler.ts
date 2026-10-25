import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { User } from '../../../domain/entities/user';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../../ports/user-query-service.port';
import { UserListAdminQuery } from './user-list-admin.query';

@QueryHandler(UserListAdminQuery)
export class UserListAdminQueryHandler implements IQueryHandler<
  UserListAdminQuery,
  PaginatedResult<User>
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  execute(query: UserListAdminQuery): Promise<PaginatedResult<User>> {
    return this.userQueryService.findUsersAdmin({
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      sort: query.sort,
      order: query.order,
      filter: {
        role: query.role,
        status: query.status,
        searchKeyword: query.searchKeyword,
      },
    });
  }
}
