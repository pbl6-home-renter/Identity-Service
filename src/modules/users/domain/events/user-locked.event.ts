import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

export class UserLockedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.LOCKED;
  readonly routingKey = USER_EVENTS.LOCKED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly role: UserRole,
    readonly status: UserStatus,
    readonly lockReason: string,
    readonly lockedAt: Date,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return {
      userId: this.userId,
      role: this.role,
      status: this.status,
      lockReason: this.lockReason,
      lockedAt: this.lockedAt.toISOString(),
    };
  }
}
