import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MediaStatus } from '../../../domain/enums/media-status.enum';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { mediaResourcePath } from '../../media-resource-path';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaLookupInternalResult } from '../media-lookup-internal/media-lookup-internal.query.handler';
import { MediaOwnerLookupQuery } from './media-owner-lookup.query';

@QueryHandler(MediaOwnerLookupQuery)
export class MediaOwnerLookupQueryHandler implements IQueryHandler<
  MediaOwnerLookupQuery,
  MediaLookupInternalResult[]
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
  ) {}

  async execute(
    query: MediaOwnerLookupQuery,
  ): Promise<MediaLookupInternalResult[]> {
    const media = await this.mediaRepository.findByOwner(
      query.ownerType,
      query.ownerId,
    );
    return media
      .filter((item) => item.status === MediaStatus.UPLOADED)
      .map((item) => ({
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
