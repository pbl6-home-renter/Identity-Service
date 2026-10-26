import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '../../../domain/entities/user';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../../ports/user-query-service.port';
import { UserLookupInternalQuery } from './user-lookup-internal.query';

/** Service-to-service lookup; deleted users are included so callers can tell them apart. */
@QueryHandler(UserLookupInternalQuery)
export class UserLookupInternalQueryHandler implements IQueryHandler<
  UserLookupInternalQuery,
  User[]
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  execute(query: UserLookupInternalQuery): Promise<User[]> {
    return this.userQueryService.findByIdsIncludingDeleted(query.userIds);
  }
}
