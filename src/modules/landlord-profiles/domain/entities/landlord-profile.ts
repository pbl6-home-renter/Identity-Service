import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { LandlordProfileProps } from './landlord-profile.props';
import { PayoutAccount } from '../value-objects/payout-account.vo';
import { LandlordPayoutAccountUpdatedEvent } from '../events/landlord-payout-account-updated.event';

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

  /** Returns the profile with `payoutAccount`, recording the change if there is one. */
  static withPayoutAccount(
    existing: LandlordProfile | null,
    userId: Uuid,
    payoutAccount: PayoutAccount | null,
  ): LandlordProfile {
    const profile = LandlordProfile.reconstitute({
      id: existing?.id,
      userId,
      payoutAccount,
      createdAt: existing?.createdAt,
      updatedAt: new Date(),
      isDeleted: existing?.isDeleted ?? false,
    });

    const previous = existing?.payoutAccount ?? null;
    const changed =
      previous === null || payoutAccount === null
        ? previous !== payoutAccount
        : !previous.equals(payoutAccount);
    if (changed) {
      profile.addDomainEvent(
        new LandlordPayoutAccountUpdatedEvent(profile.id, userId),
      );
    }
    return profile;
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
