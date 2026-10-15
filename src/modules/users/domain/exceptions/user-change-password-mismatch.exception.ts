import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserChangePasswordMismatchException extends BaseException {
  constructor() {
    super(
      'Password confirmation does not match',
      422,
      'USER_CHANGE_PASSWORD_MISMATCH',
    );
  }
}
