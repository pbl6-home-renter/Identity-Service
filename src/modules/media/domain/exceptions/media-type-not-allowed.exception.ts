import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaTypeNotAllowedException extends DomainException {
  constructor() {
    super(
      'File type or size is not allowed for this purpose',
      422,
      'MEDIA_TYPE_NOT_ALLOWED',
    );
  }
}
