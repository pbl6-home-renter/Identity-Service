import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Media } from '../../../domain/entities/media';
import { MediaUploadLimits } from '../../../domain/entities/media.props';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { IObjectStorage } from '../../ports/object-storage.port';
import { MediaUploadTicketResult } from '../../results/media-upload-ticket.result';
import { MediaAccessService } from '../../services/media-access.service';
import { MediaPresignUploadCommand } from './media-presign-upload.command';

/** Step 1 of the upload: record the file as pending and hand out a signed PUT URL. */
@CommandHandler(MediaPresignUploadCommand)
export class MediaPresignUploadCommandHandler implements ICommandHandler<
  MediaPresignUploadCommand,
  MediaUploadTicketResult
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(MEDIA_DI_TOKEN.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
    @Inject(MEDIA_DI_TOKEN.UPLOAD_LIMITS)
    private readonly limits: MediaUploadLimits,
    private readonly access: MediaAccessService,
  ) {}

  async execute({
    actor,
    request,
  }: MediaPresignUploadCommand): Promise<MediaUploadTicketResult> {
    const media = Media.requestUpload(request, this.limits);
    await this.access.assertCanUpload(actor, media);

    const expiresIn = this.limits.ticketTtlSeconds;
    const uploadUrl = await this.storage.createUploadUrl(media, expiresIn);
    await this.mediaRepository.save(media);

    return { media, uploadUrl, expiresIn };
  }
}
