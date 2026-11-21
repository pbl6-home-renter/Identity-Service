import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { IUserQueryService } from '../../ports/user-query-service.port';
import { UserStatsResult } from '../../results/user-stats.result';
import { UserStatsQuery } from './user-stats.query';

@QueryHandler(UserStatsQuery)
export class UserStatsQueryHandler implements IQueryHandler<
  UserStatsQuery,
  UserStatsResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  async execute(): Promise<UserStatsResult> {
    const counts = await this.userQueryService.countUsersByRoleAndStatus();
    const byRole = { admin: 0, landlord: 0, tenant: 0 };
    const byStatus = { active: 0, locked: 0, pendingVerification: 0 };

    for (const { role, status, count } of counts) {
      if (role === UserRole.ADMIN) byRole.admin += count;
      if (role === UserRole.LANDLORD) byRole.landlord += count;
      if (role === UserRole.TENANT) byRole.tenant += count;

      if (status === UserStatus.ACTIVE) byStatus.active += count;
      if (status === UserStatus.LOCKED) byStatus.locked += count;
      if (status === UserStatus.PENDING_VERIFICATION) {
        byStatus.pendingVerification += count;
      }
    }

    return {
      totalUsers: counts.reduce((total, row) => total + row.count, 0),
      byRole,
      byStatus,
      generatedAt: new Date().toISOString(),
    };
  }
}
