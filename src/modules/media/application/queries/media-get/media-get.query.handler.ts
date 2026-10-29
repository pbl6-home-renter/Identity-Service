import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MediaNotFoundException } from '../../../domain/exceptions/media-not-found.exception';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaFileResult } from '../../results/media-file.result';
import { MediaAccessService } from '../../services/media-access.service';
import { MediaGetQuery } from './media-get.query';

@QueryHandler(MediaGetQuery)
export class MediaGetQueryHandler implements IQueryHandler<
  MediaGetQuery,
  MediaFileResult
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
    private readonly access: MediaAccessService,
  ) {}

  async execute({ actor, mediaId }: MediaGetQuery): Promise<MediaFileResult> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new MediaNotFoundException();
    }

    media.ensureReadable();
    await this.access.assertCanRead(actor, media);

    return { media, content: await this.storage.read(media) };
  }
}
