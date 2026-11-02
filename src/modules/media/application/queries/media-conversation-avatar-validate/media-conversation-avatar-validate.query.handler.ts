import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';
import { MediaStatus } from '../../../domain/enums/media-status.enum';
import { IMediaRepository } from '../../../domain/repositories/media.repository.interface';
import { MEDIA_DI_TOKEN } from '../../../media.di-token';
import { MediaConversationAvatarValidateQuery } from './media-conversation-avatar-validate.query';

export interface MediaConversationAvatarValidationResult {
  valid: boolean;
}

@QueryHandler(MediaConversationAvatarValidateQuery)
export class MediaConversationAvatarValidateQueryHandler implements IQueryHandler<
  MediaConversationAvatarValidateQuery,
  MediaConversationAvatarValidationResult
> {
  constructor(
    @Inject(MEDIA_DI_TOKEN.REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(
    query: MediaConversationAvatarValidateQuery,
  ): Promise<MediaConversationAvatarValidationResult> {
    const media = await this.mediaRepository.findById(query.mediaId);
    return {
      valid:
        media !== null &&
        !media.isDeleted &&
        media.status === MediaStatus.UPLOADED &&
        media.ownerType === MediaOwnerType.CONVERSATION &&
        media.ownerId.toLowerCase() === query.conversationId.toLowerCase() &&
        media.purpose === MediaPurpose.CONVERSATION_AVATAR,
    };
  }
}
