import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { Media } from '../../../domain/entities/media';
import { MediaNotFoundException } from '../../../domain/exceptions/media-not-found.exception';
import { MediaTypeNotAllowedException } from '../../../domain/exceptions/media-type-not-allowed.exception';
import { MediaUploadNotCompletedException } from '../../../domain/exceptions/media-upload-not-completed.exception';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { mediaResourcePath } from '../../media-resource-path';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaCompletedResult } from '../../results/media-completed.result';
import { MediaAccessService } from '../../services/media-access.service';
import { MediaCompleteUploadCommand } from './media-complete-upload.command';

/**
 * Step 2 of the upload: check the file really is in storage as declared,
 * then mark it uploaded. Calling it again on an uploaded file is a no-op.
 */
@CommandHandler(MediaCompleteUploadCommand)
export class MediaCompleteUploadCommandHandler implements ICommandHandler<
  MediaCompleteUploadCommand,
  MediaCompletedResult
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    private readonly access: MediaAccessService,
  ) {}

  async execute({
    actor,
    mediaId,
  }: MediaCompleteUploadCommand): Promise<MediaCompletedResult> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new MediaNotFoundException();
    }

    this.access.assertCanComplete(actor, media);
    media.ensureCompletable();

    if (!media.isUploaded) {
      await this.verifyStoredFile(media);
      await this.markUploaded(media);
    }

    return { media, url: this.urlOf(media) };
  }

  private async verifyStoredFile(media: Media): Promise<void> {
    const file = await this.storage.stat(media);
    if (!file) {
      throw new MediaUploadNotCompletedException();
    }
    if (!media.matches(file)) {
      await this.storage.remove(media);
      throw new MediaTypeNotAllowedException();
    }
  }

  /** For single-file purposes (avatar, cover photo) the previous file is replaced. */
  private async markUploaded(media: Media): Promise<void> {
    const replaced = media.policy.singlePerOwner
      ? await this.mediaRepository.findUploadedByOwner(
          media.ownerType,
          media.ownerId,
          media.purpose,
        )
      : [];

    media.markUploaded();
    replaced.forEach((previous) => previous.delete());

    await this.unitOfWork.run(async (context) => {
      for (const changed of [...replaced, media]) {
        await this.mediaRepository.save(changed, context);
      }
    });

    // Best effort: an object left behind only wastes space, it is never served.
    await Promise.allSettled(
      replaced.map((previous) => this.storage.remove(previous)),
    );
  }

  private urlOf(media: Media): string {
    return media.isPublic
      ? this.storage.publicUrl(media)
      : mediaResourcePath(media.id);
  }
}
