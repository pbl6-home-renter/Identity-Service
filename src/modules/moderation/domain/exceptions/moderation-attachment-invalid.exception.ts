import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class ModerationAttachmentInvalidException extends DomainException {
  constructor() {
    super(
      'Attachments must be your own uploaded files of the right purpose',
      422,
      'MODERATION_ATTACHMENT_INVALID',
    );
  }
}
