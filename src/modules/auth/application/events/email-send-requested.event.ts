import { DomainEvent } from 'shared/domain/base/domain-event';
import { Uuid, generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { EMAIL_SEND_REQUESTED_EVENT } from './email-send-requested.event.constants';

export interface EmailSendRequestedPayload {
  emailRequestId: Uuid;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailSendRequestedEvent implements DomainEvent {
  readonly eventType = EMAIL_SEND_REQUESTED_EVENT;
  readonly routingKey = EMAIL_SEND_REQUESTED_EVENT;
  readonly aggregateType = 'EmailDelivery';
  readonly occurredAt = new Date();
  readonly emailRequestId = generateUuid();
  readonly aggregateId: Uuid;

  constructor(
    readonly to: string,
    readonly subject: string,
    readonly text: string,
    readonly html: string,
  ) {
    this.aggregateId = this.emailRequestId;
  }

  get payload(): Record<string, unknown> {
    return {
      emailRequestId: this.emailRequestId,
      to: this.to,
      subject: this.subject,
      text: this.text,
      html: this.html,
    } satisfies EmailSendRequestedPayload;
  }
}
