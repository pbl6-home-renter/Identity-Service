import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';
import { MediaNotFoundException } from '../../../domain/exceptions/media-not-found.exception';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaAccessService } from '../../services/media-access.service';
import { MediaGetDownloadUrlQuery } from './media-get-download-url.query';

@QueryHandler(MediaGetDownloadUrlQuery)
export class MediaGetDownloadUrlQueryHandler implements IQueryHandler<
  MediaGetDownloadUrlQuery,
  string
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
    private readonly access: MediaAccessService,
  ) {}

  async execute({ actor, mediaId }: MediaGetDownloadUrlQuery): Promise<string> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new MediaNotFoundException();
    }

    media.ensureReadable();
    await this.access.assertCanRead(actor, media);

    if (
      media.purpose !== MediaPurpose.CHAT_ATTACHMENT &&
      media.purpose !== MediaPurpose.CONVERSATION_AVATAR
    ) {
      throw new MediaNotFoundException();
    }

    return this.storage.createDownloadUrl(media);
  }
}
