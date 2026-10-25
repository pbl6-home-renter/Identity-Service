import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
} from '../constants/user-event.constants';

/**
 * Carries the raw reset token so Community can email the link. Never log the payload;
 * published outbox rows are purged after `OUTBOX_RETENTION_MS`.
 */
export class UserPasswordResetRequestedEvent implements DomainEvent {
  readonly eventType = USER_EVENTS.PASSWORD_RESET_REQUESTED;
  readonly routingKey = USER_EVENTS.PASSWORD_RESET_REQUESTED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly userId: Uuid,
    readonly email: string,
    readonly name: string,
    readonly token: string,
    readonly expiresAt: Date,
  ) {}

  get aggregateId(): Uuid {
    return this.userId;
  }

  get payload(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      token: this.token,
      expiresAt: this.expiresAt.toISOString(),
    };
  }
}
