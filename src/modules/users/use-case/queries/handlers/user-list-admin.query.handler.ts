import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../services/user-query.service.interface';
import { UserListAdminQuery } from '../implements/user-list-admin.query';
import { UserListAdminResponseDto } from '../../../presentation/response/user-list-admin.response.dto';

@QueryHandler(UserListAdminQuery)
export class UserListAdminQueryHandler implements IQueryHandler<
  UserListAdminQuery,
  PaginatedResponseDto<UserListAdminResponseDto>
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  async execute(
    query: UserListAdminQuery,
  ): Promise<PaginatedResponseDto<UserListAdminResponseDto>> {
    const result = await this.userQueryService.findUsersAdmin({
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

    return {
      data: result.data.map((user) =>
        UserListAdminResponseDto.fromDomain(user),
      ),
      pagination: result.pagination,
    };
  }
}
