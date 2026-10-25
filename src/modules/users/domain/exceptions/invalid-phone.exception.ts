import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class InvalidPhoneException extends DomainException {
  constructor(phone: string) {
    super(`Phone "${phone}" is invalid`, 422, 'PHONE_INVALID_FORMAT');
  }
}
