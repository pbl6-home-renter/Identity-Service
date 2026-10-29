import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaInvalidPurposeException extends DomainException {
  constructor() {
    super('Purpose does not match the owner type', 422, 'INVALID_PURPOSE');
  }
}
