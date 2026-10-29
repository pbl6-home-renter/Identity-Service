import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaOwnerUnavailableException extends DomainException {
  constructor() {
    super(
      'The service owning this entity is not available yet',
      503,
      'SERVICE_UNAVAILABLE',
    );
  }
}
