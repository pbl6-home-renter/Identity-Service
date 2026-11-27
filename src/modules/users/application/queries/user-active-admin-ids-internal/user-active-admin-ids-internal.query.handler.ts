import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../../ports/user-query-service.port';
import { UserActiveAdminIdsInternalQuery } from './user-active-admin-ids-internal.query';

@QueryHandler(UserActiveAdminIdsInternalQuery)
export class UserActiveAdminIdsInternalQueryHandler implements IQueryHandler<
  UserActiveAdminIdsInternalQuery,
  Uuid[]
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly users: IUserQueryService,
  ) {}

  execute(): Promise<Uuid[]> {
    return this.users.findActiveAdminIds();
  }
}
