import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { mediaResourcePath } from '../../media-resource-path';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaUserAvatarLookupQuery } from './media-user-avatar-lookup.query';

/** Maps user id → avatar URL. */
export type UserAvatarUrlMap = Map<Uuid, string>;

@QueryHandler(MediaUserAvatarLookupQuery)
export class MediaUserAvatarLookupQueryHandler implements IQueryHandler<
  MediaUserAvatarLookupQuery,
  UserAvatarUrlMap
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
  ) {}

  async execute({
    userIds,
  }: MediaUserAvatarLookupQuery): Promise<UserAvatarUrlMap> {
    const media = await this.mediaRepository.findUploadedByOwners(
      MediaOwnerType.USER,
      userIds,
      MediaPurpose.AVATAR,
    );
    return new Map(
      media.map((item) => [
        item.ownerId,
        item.isPublic
          ? this.storage.publicUrl(item)
          : mediaResourcePath(item.id),
      ]),
    );
  }
}
