import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class MediaChatAttachmentValidateQuery {
  constructor(
    readonly mediaId: Uuid,
    readonly conversationId: Uuid,
  ) {}
}
