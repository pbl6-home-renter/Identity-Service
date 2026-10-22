import { AggregateRoot } from 'shared/domain/entities/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';
import { LandlordProfileProps } from './landlord-profile.props';
import { PayoutAccount } from '../value-objects/payout-account.vo';

export class LandlordProfile extends AggregateRoot {
  private constructor(
    readonly userId: Uuid,
    readonly payoutAccount: PayoutAccount | null,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  static create(props: LandlordProfileProps): LandlordProfile {
    return LandlordProfile.reconstitute(props);
  }

  static reconstitute(props: LandlordProfileProps): LandlordProfile {
    return new LandlordProfile(
      props.userId,
      props.payoutAccount ?? null,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
