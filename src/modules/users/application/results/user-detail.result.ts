import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { User } from '../../domain/entities/user';

export class UserDetailResult {
  constructor(
    readonly user: User,
    readonly payoutAccount: PayoutAccount | null,
    readonly buildingCount: number | null,
    readonly activeContractCount: number | null,
  ) {}

  static create(
    user: User,
    payoutAccount: PayoutAccount | null,
    buildingCount: number | null,
    activeContractCount: number | null,
  ): UserDetailResult {
    return new UserDetailResult(
      user,
      payoutAccount,
      buildingCount,
      activeContractCount,
    );
  }
}
