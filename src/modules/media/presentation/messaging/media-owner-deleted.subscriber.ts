import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { INBOX_DI_TOKEN } from 'modules/inbox/inbox.di-token';
import { InboxRepository } from 'modules/inbox/application/ports/inbox.repository';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { ConsumerRegistry } from 'shared/infrastructure/messaging/rabbitmq/consumer/consumer-registry';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../media.di-token';
import { IObjectStorage } from '../../application/ports/object-storage.port';
import {
  MEDIA_OWNER_CLEANUP_CONSUMER,
  MEDIA_OWNER_CLEANUP_QUEUE,
  MEDIA_OWNER_DELETED_EVENTS,
} from './media-owner-cleanup.constants';

const OWNER_BY_EVENT: Readonly<Record<string, MediaOwnerType>> = {
  'building.deleted': MediaOwnerType.BUILDING,
  'room.deleted': MediaOwnerType.ROOM,
  'user.deleted': MediaOwnerType.USER,
};

@Injectable()
export class MediaOwnerDeletedSubscriber {
  constructor(
    @Inject(INBOX_DI_TOKEN.REPOSITORY) private readonly inbox: InboxRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN) private readonly unitOfWork: IUnitOfWork,
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
  ) {}

  @RabbitSubscribe({
    name: ConsumerRegistry.define({
      name: MEDIA_OWNER_CLEANUP_CONSUMER,
      queue: MEDIA_OWNER_CLEANUP_QUEUE,
      routingKeys: MEDIA_OWNER_DELETED_EVENTS,
    }),
  })
  async handle(event: IntegrationEvent): Promise<void> {
    const ownerType = OWNER_BY_EVENT[event.eventType];
    if (!ownerType) return;

    let removed: Awaited<ReturnType<IMediaRepository['findByOwner']>> = [];
    await this.unitOfWork.run(async (context) => {
      const isNew = await this.inbox.recordIfNew(
        event.id,
        event.eventType,
        context,
      );
      if (!isNew) return;
      removed = await this.mediaRepository.findByOwner(
        ownerType,
        event.aggregateId,
      );
      for (const media of removed) {
        media.delete();
        await this.mediaRepository.save(media, context);
      }
    });
    await Promise.allSettled(
      removed.map((media) => this.storage.remove(media)),
    );
  }
}
