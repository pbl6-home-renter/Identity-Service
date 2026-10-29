import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaUnauthenticatedException extends DomainException {
  constructor() {
    super('Sign in to access this media', 401, 'UNAUTHORIZED');
  }
}
