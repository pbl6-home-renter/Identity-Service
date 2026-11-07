import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaNotFoundException } from '../../../domain/exceptions/media-not-found.exception';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { mediaResourcePath } from '../../media-resource-path';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaLookupInternalQuery } from './media-lookup-internal.query';

export interface MediaLookupInternalResult {
  id: Uuid;
  ownerType: string;
  ownerId: Uuid;
  purpose: string;
  status: string;
  url: string;
}

@QueryHandler(MediaLookupInternalQuery)
export class MediaLookupInternalQueryHandler implements IQueryHandler<
  MediaLookupInternalQuery,
  MediaLookupInternalResult[]
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
  ) {}

  async execute({
    ids,
  }: MediaLookupInternalQuery): Promise<MediaLookupInternalResult[]> {
    const media = await this.mediaRepository.findByIds(ids);
    if (media.length !== new Set(ids).size) throw new MediaNotFoundException();

    return media.map((item) => ({
      id: item.id,
      ownerType: item.ownerType,
      ownerId: item.ownerId,
      purpose: item.purpose,
      status: item.status,
      url: item.isPublic
        ? this.storage.publicUrl(item)
        : mediaResourcePath(item.id),
    }));
  }
}
