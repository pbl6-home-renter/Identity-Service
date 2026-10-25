import { IQuery } from '@nestjs/cqrs';
import { SortOrder } from 'shared/domain/value-objects/sort-order.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { UserSortField } from '../models/user-sort-field';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserListAdminInput {
  pageNo: number;
  pageSize: number;
  sort?: UserSortField;
  order?: SortOrder;
  role?: UserRole;
  status?: UserStatus;
  q?: string;
}

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

  static create(request: UserListAdminInput): UserListAdminQuery {
    return new UserListAdminQuery(
      request.pageNo,
      request.pageSize,
      request.sort,
      request.order,
      request.role,
      request.status,
      request.q,
    );
  }
}
