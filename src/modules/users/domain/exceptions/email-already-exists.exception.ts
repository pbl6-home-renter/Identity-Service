import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" already exists`, 409, 'DUPLICATE_EMAIL');
  }
}
