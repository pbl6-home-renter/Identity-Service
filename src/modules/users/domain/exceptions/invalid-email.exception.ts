import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class InvalidEmailException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" is invalid`, 422, 'EMAIL_INVALID_FORMAT');
  }
}
