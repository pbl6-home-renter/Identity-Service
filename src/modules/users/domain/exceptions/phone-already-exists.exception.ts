import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class PhoneAlreadyExistsException extends DomainException {
  constructor(phone: string) {
    super(`Phone "${phone}" already exists`, 409, 'DUPLICATE_PHONE');
  }
}
