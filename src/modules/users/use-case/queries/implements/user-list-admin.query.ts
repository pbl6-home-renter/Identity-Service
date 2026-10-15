import { IQuery } from '@nestjs/cqrs';
import { SortOrder } from 'shared/domain/value-objects/sort-order.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { UserSortField } from '../../../presentation/constants/user-sort-field.constant';
import { UserListAdminQueryRequestDto } from '../../../presentation/request/user-list-admin.query.request.dto';

export class UserListAdminQuery implements IQuery {
  constructor(
    readonly pageNo: number,
    readonly pageSize: number,
    readonly sort?: UserSortField,
    readonly order?: SortOrder,
    readonly role?: UserRole,
    readonly status?: UserStatus,
    readonly searchKeyword?: string,
  ) {}

  static create(request: UserListAdminQueryRequestDto): UserListAdminQuery {
    return new UserListAdminQuery(
      request.pageNo,
      request.pageSize,
      request.sort,
      request.order,
      request.filter?.role,
      request.filter?.status,
      request.filter?.q,
    );
  }
}
