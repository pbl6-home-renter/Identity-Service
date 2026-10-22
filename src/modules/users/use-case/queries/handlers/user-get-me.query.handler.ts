import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { UserGetMeQuery } from '../implements/user-get-me.query';
import { IUserQueryService } from '../services/user-query.service.interface';

@QueryHandler(UserGetMeQuery)
export class UserGetMeQueryHandler implements IQueryHandler<
  UserGetMeQuery,
  CurrentUserProfileResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
  ) {}

  async execute(query: UserGetMeQuery): Promise<CurrentUserProfileResult> {
    const userWithLandlordProfile = await this.userQueryService.findByUserId(
      query.userId,
    );
    if (!userWithLandlordProfile) {
      throw new UserNotFoundException();
    }

    const { user, landlordProfile } = userWithLandlordProfile;
    const payoutAccount =
      user.role === UserRole.LANDLORD
        ? this.toPayoutAccount(landlordProfile)
        : null;

    return CurrentUserProfileResult.create(user, payoutAccount);
  }

  private toPayoutAccount(
    profile: LandlordProfile | null,
  ): PayoutAccount | null {
    return profile?.payoutAccount ?? null;
  }
}
