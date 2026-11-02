import { IsNotEmpty } from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IsUuid } from 'shared/presentation/validators/is-uuid.decorator';

export class MediaChatAttachmentValidateRequestDto {
  @IsUuid()
  @IsNotEmpty()
  mediaId: Uuid;

  @IsUuid()
  @IsNotEmpty()
  conversationId: Uuid;
}
