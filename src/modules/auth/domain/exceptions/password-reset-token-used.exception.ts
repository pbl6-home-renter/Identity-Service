import { BaseException } from 'shared/domain/exceptions/base.exception';

export class PasswordResetTokenUsedException extends BaseException {
  constructor() {
    super(
      'Password reset token is invalid or has already been used',
      409,
      'TOKEN_USED',
    );
  }
}
