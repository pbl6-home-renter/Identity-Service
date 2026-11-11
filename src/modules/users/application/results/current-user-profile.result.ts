import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { User } from '../../domain/entities/user';

export class CurrentUserProfileResult {
  private constructor(
    readonly user: User,
    readonly payoutAccount: PayoutAccount | null,
    readonly avatarUrl: string | null,
  ) {}

  static create(
    user: User,
    payoutAccount: PayoutAccount | null,
    avatarUrl: string | null = null,
  ): CurrentUserProfileResult {
    return new CurrentUserProfileResult(user, payoutAccount, avatarUrl);
  }
}
