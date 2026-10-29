import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaNotFoundException extends DomainException {
  constructor() {
    super('Media not found', 404, 'RESOURCE_NOT_FOUND');
  }
}
