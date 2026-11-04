import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../../ports/user-query-service.port';
import { UserDirectoryEntryModel } from '../models/user-directory-entry.model';
import { UserDirectoryListQuery } from './user-directory-list.query';

@QueryHandler(UserDirectoryListQuery)
export class UserDirectoryListQueryHandler implements IQueryHandler<
  UserDirectoryListQuery,
  PaginatedResult<UserDirectoryEntryModel>
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  execute(
    query: UserDirectoryListQuery,
  ): Promise<PaginatedResult<UserDirectoryEntryModel>> {
    return this.userQueryService.findDirectoryUsers({
      callerUserId: query.callerUserId,
      searchKeyword: query.searchKeyword,
      pageNo: query.pageNo,
      pageSize: query.pageSize,
    });
  }
}
