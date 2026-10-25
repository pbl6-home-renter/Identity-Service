import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

export class UserUpdatedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.UPDATED;
  readonly routingKey = USER_EVENTS.UPDATED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly name: string,
    readonly phone: string,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return { userId: this.userId, name: this.name, phone: this.phone };
  }
}
