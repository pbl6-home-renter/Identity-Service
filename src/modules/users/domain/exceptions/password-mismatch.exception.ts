import { BaseException } from 'shared/domain/exceptions/base.exception';

export class PasswordMismatchException extends BaseException {
  constructor() {
    super('Password confirmation does not match', 422, 'PASSWORD_MISMATCH');
  }
}
