import { BaseException } from 'shared/domain/exceptions/base.exception';

export class PasswordResetTokenExpiredException extends BaseException {
  constructor() {
    super('Password reset token has expired', 409, 'TOKEN_EXPIRED');
  }
}
