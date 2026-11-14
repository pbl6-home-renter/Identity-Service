import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

export class UserUnlockedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.UNLOCKED;
  readonly routingKey = USER_EVENTS.UNLOCKED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly status: UserStatus,
    readonly role: UserRole,
    readonly phone: string,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return {
      userId: this.userId,
      status: this.status,
      role: this.role,
      phone: this.phone,
    };
  }
}
