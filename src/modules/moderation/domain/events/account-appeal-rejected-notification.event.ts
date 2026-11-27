import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  ACCOUNT_APPEAL_AGGREGATE_TYPE,
  MODERATION_MESSAGE_KEYS,
  MODERATION_NOTIFICATION_EVENTS,
} from '../constants/moderation-event.constants';
import { ModerationNotificationCodeConstant } from '../constants/moderation-notification-code.constant';

/** Tells the appellant the result; see community-service docs/notifications.md. */
export class AccountAppealRejectedNotificationEvent implements DomainEvent {
  readonly eventType = MODERATION_NOTIFICATION_EVENTS.REQUESTED;
  readonly routingKey = MODERATION_NOTIFICATION_EVENTS.REQUESTED;
  readonly aggregateType = ACCOUNT_APPEAL_AGGREGATE_TYPE;
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: Uuid,
    readonly userId: Uuid,
    readonly rejectReason: string,
    readonly nextSubmitAt: Date,
  ) {}

  get payload(): Record<string, unknown> {
    return {
      sourceService: 'identity',
      recipientUserIds: [this.userId],
      notification: {
        type: 'system',
        title: ModerationNotificationCodeConstant.APPEAL_REJECTED_TITLE,
        body: ModerationNotificationCodeConstant.APPEAL_REJECTED_BODY,
        deepLink: '/account-locked',
        data: {
          messageKey: MODERATION_MESSAGE_KEYS.APPEAL_REJECTED,
          appealId: this.aggregateId,
          rejectReason: this.rejectReason,
          nextSubmitAt: this.nextSubmitAt.toISOString(),
        },
      },
    };
  }
}
