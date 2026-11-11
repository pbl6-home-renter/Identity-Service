import { DomainEvent } from 'shared/domain/base/domain-event';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

export class UserEmailVerifiedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.EMAIL_VERIFIED;
  readonly routingKey = USER_EVENTS.EMAIL_VERIFIED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly phone: string,
    readonly role: UserRole,
    readonly status: UserStatus,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return {
      userId: this.userId,
      phone: this.phone,
      role: this.role,
      status: this.status,
    };
  }
}
