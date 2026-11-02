import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalOnly } from 'shared/presentation/decorators/auth/internal-only.decorator';
import { MediaChatAttachmentValidateQuery } from '../../../application/queries/media-chat-attachment-validate/media-chat-attachment-validate.query';
import { MediaChatAttachmentValidationResult } from '../../../application/queries/media-chat-attachment-validate/media-chat-attachment-validate.query.handler';
import { MediaChatAttachmentValidateRequestDto } from '../requests/media-chat-attachment-validate.request.dto';

@ApiExcludeController()
@InternalOnly()
@Controller('internal/media')
export class MediaInternalController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
