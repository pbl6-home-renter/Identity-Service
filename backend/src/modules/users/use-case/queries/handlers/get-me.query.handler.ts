import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { GetMeQuery } from '../implements/get-me.query';
import { IGetMeQueryRepository } from '../repositories/get-me-query.repository.interface';

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<
  GetMeQuery,
  CurrentUserProfileResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.GET_ME_QUERY_REPOSITORY)
    private readonly getMeQueryRepository: IGetMeQueryRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<CurrentUserProfileResult> {
    const userWithLandlordProfile =
      await this.getMeQueryRepository.findByUserId(query.userId);
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
    if (!profile?.bankCode || !profile.accountNumber || !profile.accountName) {
      return null;
    }

    return {
      bankCode: profile.bankCode,
      accountNumber: profile.accountNumber,
      accountName: profile.accountName,
    };
  }
}
