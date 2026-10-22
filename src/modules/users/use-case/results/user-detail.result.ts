import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { User } from '../../domain/entities/user';

export class UserDetailResult {
  constructor(
    readonly user: User,
    readonly payoutAccount: PayoutAccount | null,
    readonly buildingCount: number = 0,
    readonly activeContractCount: number = 0,
  ) {}

  static create(
    user: User,
    payoutAccount: PayoutAccount | null,
    buildingCount: number = 0,
    activeContractCount: number = 0,
  ): UserDetailResult {
    return new UserDetailResult(
      user,
      payoutAccount,
      buildingCount,
      activeContractCount,
    );
  }
}
