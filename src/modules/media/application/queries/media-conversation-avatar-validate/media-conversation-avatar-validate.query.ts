import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class MediaConversationAvatarValidateQuery {
  constructor(
    readonly mediaId: Uuid,
    readonly conversationId: Uuid,
  ) {}
}
