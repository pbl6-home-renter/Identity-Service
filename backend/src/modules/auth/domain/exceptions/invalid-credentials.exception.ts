import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidCredentialsException extends BaseException {
  constructor() {
    super('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
}
