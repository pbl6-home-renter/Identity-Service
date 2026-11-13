import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';
import { MediaStatus } from '../../../domain/enums/media-status.enum';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { MediaChatAttachmentValidateQuery } from './media-chat-attachment-validate.query';

export interface MediaChatAttachmentValidationResult {
  valid: boolean;
  fileType: string | null;
}

@QueryHandler(MediaChatAttachmentValidateQuery)
export class MediaChatAttachmentValidateQueryHandler implements IQueryHandler<
  MediaChatAttachmentValidateQuery,
  MediaChatAttachmentValidationResult
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(
    query: MediaChatAttachmentValidateQuery,
  ): Promise<MediaChatAttachmentValidationResult> {
    const media = await this.mediaRepository.findById(query.mediaId);
    return {
      fileType: media?.fileType ?? null,
      valid:
        media !== null &&
        !media.isDeleted &&
        media.status === MediaStatus.UPLOADED &&
        media.ownerType === MediaOwnerType.CONVERSATION &&
        media.ownerId.toLowerCase() === query.conversationId.toLowerCase() &&
        media.purpose === MediaPurpose.CHAT_ATTACHMENT,
    };
  }
}
