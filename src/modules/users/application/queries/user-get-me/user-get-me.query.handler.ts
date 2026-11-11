import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { MediaOwnerLookupQuery } from 'modules/media/application/queries/media-owner-lookup/media-owner-lookup.query';
import { MediaLookupInternalResult } from 'modules/media/application/queries/media-lookup-internal/media-lookup-internal.query.handler';
import { MediaOwnerType } from 'modules/media/domain/enums/media-owner-type.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { UserGetMeQuery } from './user-get-me.query';
import { IUserQueryService } from '../../ports/user-query-service.port';

@QueryHandler(UserGetMeQuery)
export class UserGetMeQueryHandler implements IQueryHandler<
  UserGetMeQuery,
  CurrentUserProfileResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.QUERY_SERVICE)
    private readonly userQueryService: IUserQueryService,
    private readonly queryBus: QueryBus,
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
    const media: MediaLookupInternalResult[] = await this.queryBus.execute(
      new MediaOwnerLookupQuery(
        MediaOwnerType.USER,
        user.id,
        MediaPurpose.AVATAR,
      ),
    );
    const avatarUrl =
      media.find((item) => item.purpose === MediaPurpose.AVATAR)?.url ?? null;

    return CurrentUserProfileResult.create(user, payoutAccount, avatarUrl);
  }

  private toPayoutAccount(
    profile: LandlordProfile | null,
  ): PayoutAccount | null {
    return profile?.payoutAccount ?? null;
  }
}
