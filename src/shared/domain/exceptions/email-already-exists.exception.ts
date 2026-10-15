import { BaseException } from './base.exception';

export class EmailAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`Email "${email}" already exists`, 409, 'DUPLICATE_EMAIL');
  }
}
