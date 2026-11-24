import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InboxRepository } from 'modules/inbox/application/ports/inbox.repository';
import { INBOX_DI_TOKEN } from 'modules/inbox/inbox.di-token';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { ConsumerRegistry } from 'shared/infrastructure/messaging/rabbitmq/consumer/consumer-registry';
import { AuditRecorder } from '../../application/ports/audit-recorder.port';
import { toBuildingReviewAuditEntry } from '../../application/mappers/building-review-audit.mapper';
import { AUDIT_RECORDER_DI_TOKEN } from '../../audit.di-token';
import {
  BUILDING_REVIEW_AUDIT_CONSUMER,
  BUILDING_REVIEW_AUDIT_EVENTS,
  BUILDING_REVIEW_AUDIT_QUEUE,
} from './building-review-audit.constants';

@Injectable()
export class BuildingReviewAuditSubscriber {
  constructor(
    @Inject(INBOX_DI_TOKEN.REPOSITORY) private readonly inbox: InboxRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN) private readonly unitOfWork: IUnitOfWork,
    @Inject(AUDIT_RECORDER_DI_TOKEN) private readonly audit: AuditRecorder,
  ) {}

  @RabbitSubscribe({
    name: ConsumerRegistry.define({
      name: BUILDING_REVIEW_AUDIT_CONSUMER,
      queue: BUILDING_REVIEW_AUDIT_QUEUE,
      routingKeys: BUILDING_REVIEW_AUDIT_EVENTS,
    }),
  })
  async handle(event: IntegrationEvent): Promise<void> {
    const entry = toBuildingReviewAuditEntry(event);
    await this.unitOfWork.run(async (context) => {
      const isNew = await this.inbox.recordIfNew(
        event.id,
        event.eventType,
        context,
      );
      if (!isNew) return;
      await this.audit.record(entry, context);
    });
  }
}
