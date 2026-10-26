import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import {
  PeerServiceRequestException,
  PeerServiceUnavailableException,
} from 'shared/application/http/peer-service.exception';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserDetailResult } from '../../results/user-detail.result';
import { UserGetDetailAdminQuery } from './user-get-detail-admin.query';
import { IUserQueryService } from '../../ports/user-query-service.port';
import {
  ITenancyUserStatsService,
  UserTenancyStats,
} from '../../ports/tenancy-user-stats.port';

@QueryHandler(UserGetDetailAdminQuery)
export class UserGetDetailAdminQueryHandler implements IQueryHandler<
  UserGetDetailAdminQuery,
  UserDetailResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
    @Inject(USERS_DI_TOKEN.TENANCY_USER_STATS)
    private readonly tenancyUserStatsService: ITenancyUserStatsService,
  ) {}

  async execute(query: UserGetDetailAdminQuery): Promise<UserDetailResult> {
    const record = await this.userQueryService.findByUserId(query.userId);
    if (!record) {
      throw new UserNotFoundException();
    }

    const { user, landlordProfile } = record;
    const payoutAccount =
      user.role === UserRole.LANDLORD
        ? this.toPayoutAccount(landlordProfile)
        : null;

    const stats = await this.findTenancyStats(user.id);

    return UserDetailResult.create(
      user,
      payoutAccount,
      stats?.buildingCount ?? null,
      stats?.activeContractCount ?? null,
    );
  }

  private async findTenancyStats(
    userId: Uuid,
  ): Promise<UserTenancyStats | null> {
    try {
      return await this.tenancyUserStatsService.getUserStats(userId);
    } catch (error) {
      if (
        error instanceof PeerServiceUnavailableException ||
        error instanceof PeerServiceRequestException
      ) {
        return null;
      }
      throw error;
    }
  }

  private toPayoutAccount(
    profile: LandlordProfile | null,
  ): PayoutAccount | null {
    return profile?.payoutAccount ?? null;
  }
}
