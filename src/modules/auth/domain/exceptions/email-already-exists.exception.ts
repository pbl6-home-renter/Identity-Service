import { BaseException } from 'shared/domain/exceptions/base.exception';

export class EmailAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`Email "${email}" already exists`, 409, 'DUPLICATE_EMAIL');
  }
}
