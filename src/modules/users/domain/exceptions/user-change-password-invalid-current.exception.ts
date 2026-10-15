import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserChangePasswordInvalidCurrentException extends BaseException {
  constructor() {
    super(
      'Current password is invalid',
      401,
      'USER_CHANGE_PASSWORD_INVALID_CURRENT',
    );
  }
}
