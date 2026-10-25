import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

export class UserDeletedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.DELETED;
  readonly routingKey = USER_EVENTS.DELETED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly role: UserRole,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return { userId: this.userId, role: this.role };
  }
}
