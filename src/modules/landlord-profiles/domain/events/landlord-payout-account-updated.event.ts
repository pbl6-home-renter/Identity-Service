import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  LANDLORD_PROFILE_AGGREGATE_TYPE,
  LANDLORD_PROFILE_EVENTS,
} from '../constants/landlord-profile-event.constants';

/** Payment only drops its payout cache, so the account number is not sent. */
export class LandlordPayoutAccountUpdatedEvent implements DomainEvent {
  readonly eventType = LANDLORD_PROFILE_EVENTS.PAYOUT_ACCOUNT_UPDATED;
  readonly routingKey = LANDLORD_PROFILE_EVENTS.PAYOUT_ACCOUNT_UPDATED;
  readonly aggregateType = LANDLORD_PROFILE_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: Uuid,
    readonly userId: Uuid,
  ) {}

  get payload(): Record<string, unknown> {
    return { userId: this.userId };
  }
}
