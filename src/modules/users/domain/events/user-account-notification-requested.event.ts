import { DomainEvent } from 'shared/domain/base/domain-event';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  USER_AGGREGATE_TYPE,
  USER_EVENTS,
  USER_NOTIFICATION_EVENTS,
} from '../constants/user-event.constants';
import { UserNotificationCodeConstant } from '../constants/user-notification-code.constant';

export class UserAccountNotificationRequestedEvent implements DomainEvent {
  readonly eventType = USER_NOTIFICATION_EVENTS.REQUESTED;
  readonly routingKey = USER_NOTIFICATION_EVENTS.REQUESTED;
  readonly aggregateType = USER_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: Uuid,
    readonly status: UserStatus,
    readonly lockedAt: Date | null,
  ) {}

  get payload(): Record<string, unknown> {
    const locked = this.status === UserStatus.LOCKED;
    return {
      sourceService: 'identity',
      recipientUserIds: [this.aggregateId],
      notification: {
        type: 'system',
        title: locked
          ? UserNotificationCodeConstant.USER_ACCOUNT_LOCKED_TITLE
          : UserNotificationCodeConstant.USER_ACCOUNT_UNLOCKED_TITLE,
        body: locked
          ? UserNotificationCodeConstant.USER_ACCOUNT_LOCKED_BODY
          : UserNotificationCodeConstant.USER_ACCOUNT_UNLOCKED_BODY,
        data: {
          userId: this.aggregateId,
          status: this.status,
          eventType: locked ? USER_EVENTS.LOCKED : USER_EVENTS.UNLOCKED,
          lockedAt: this.lockedAt?.toISOString() ?? null,
        },
      },
    };
  }
}
