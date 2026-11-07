import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalOnly } from 'shared/presentation/decorators/auth/internal-only.decorator';
import { MediaChatAttachmentValidateQuery } from '../../../application/queries/media-chat-attachment-validate/media-chat-attachment-validate.query';
import { MediaChatAttachmentValidationResult } from '../../../application/queries/media-chat-attachment-validate/media-chat-attachment-validate.query.handler';
import { MediaChatAttachmentValidateRequestDto } from '../requests/media-chat-attachment-validate.request.dto';
import { MediaConversationAvatarValidateQuery } from '../../../application/queries/media-conversation-avatar-validate/media-conversation-avatar-validate.query';
import { MediaConversationAvatarValidationResult } from '../../../application/queries/media-conversation-avatar-validate/media-conversation-avatar-validate.query.handler';
import { MediaConversationAvatarValidateRequestDto } from '../requests/media-conversation-avatar-validate.request.dto';
import { MediaLookupInternalRequestDto } from '../requests/media-lookup-internal.request.dto';
import { MediaLookupInternalResponseDto } from '../responses/media-lookup-internal.response.dto';
import { MediaLookupInternalQuery } from '../../../application/queries/media-lookup-internal/media-lookup-internal.query';
import { MediaLookupInternalResult } from '../../../application/queries/media-lookup-internal/media-lookup-internal.query.handler';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaMetadataInternalResponseDto } from '../responses/media-metadata-internal.response.dto';
import { MediaOwnerLookupQuery } from '../../../application/queries/media-owner-lookup/media-owner-lookup.query';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';

@ApiExcludeController()
@InternalOnly()
@Controller('internal/media')
export class MediaInternalController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async lookupMany(
    @Query() request: MediaLookupInternalRequestDto,
  ): Promise<MediaLookupInternalResponseDto[]> {
    const results: MediaLookupInternalResult[] = await this.queryBus.execute(
      new MediaLookupInternalQuery(request.ids),
    );
    return results.map(MediaLookupInternalResponseDto.fromResult);
  }

  @Get('owner/:ownerType/:ownerId')
  async lookupOwnerMedia(
    @Param('ownerType', new ParseEnumPipe(MediaOwnerType))
    ownerType: MediaOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: Uuid,
  ): Promise<MediaLookupInternalResponseDto[]> {
    const results: MediaLookupInternalResult[] = await this.queryBus.execute(
      new MediaOwnerLookupQuery(ownerType, ownerId),
    );
    return results.map(MediaLookupInternalResponseDto.fromResult);
  }

  @Get('chat-attachment')
  async validateChatAttachment(
    @Query() request: MediaChatAttachmentValidateRequestDto,
  ): Promise<MediaChatAttachmentValidationResult> {
    return this.queryBus.execute(
      new MediaChatAttachmentValidateQuery(
        request.mediaId,
        request.conversationId,
      ),
    );
  }

  @Get('conversation-avatar')
  async validateConversationAvatar(
    @Query() request: MediaConversationAvatarValidateRequestDto,
  ): Promise<MediaConversationAvatarValidationResult> {
    return this.queryBus.execute(
      new MediaConversationAvatarValidateQuery(
        request.mediaId,
        request.conversationId,
      ),
    );
  }

  @Get(':mediaId')
  async lookupOne(
    @Param('mediaId', ParseUUIDPipe) mediaId: Uuid,
  ): Promise<MediaMetadataInternalResponseDto> {
    const results: MediaLookupInternalResult[] = await this.queryBus.execute(
      new MediaLookupInternalQuery([mediaId]),
    );
    return MediaMetadataInternalResponseDto.fromResult(results[0]);
  }
}
