import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaForbiddenException extends DomainException {
  constructor() {
    super('Not allowed to access this media', 403, 'FORBIDDEN');
  }
}
