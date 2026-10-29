import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MediaNotFoundException } from '../../../domain/exceptions/media-not-found.exception';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaAccessService } from '../../services/media-access.service';
import { MediaDeleteCommand } from './media-delete.command';

/** Soft-deletes the record (kept for audit) and removes the file from storage. */
@CommandHandler(MediaDeleteCommand)
export class MediaDeleteCommandHandler implements ICommandHandler<
  MediaDeleteCommand,
  void
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
    private readonly access: MediaAccessService,
  ) {}

  async execute({ actor, mediaId }: MediaDeleteCommand): Promise<void> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new MediaNotFoundException();
    }

    await this.access.assertCanDelete(actor, media);
    media.delete();
    await this.mediaRepository.save(media);

    // Best effort: an object left behind only wastes space, it is never served.
    await Promise.allSettled([this.storage.remove(media)]);
  }
}
