import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserDetailResult } from '../../results/user-detail.result';
import { UserGetDetailAdminQuery } from './user-get-detail-admin.query';
import { IUserQueryService } from '../../ports/user-query-service.port';

@QueryHandler(UserGetDetailAdminQuery)
export class UserGetDetailAdminQueryHandler implements IQueryHandler<
  UserGetDetailAdminQuery,
  UserDetailResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
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

    return UserDetailResult.create(user, payoutAccount, 0, 0);
  }

  private toPayoutAccount(
    profile: LandlordProfile | null,
  ): PayoutAccount | null {
    return profile?.payoutAccount ?? null;
  }
}
