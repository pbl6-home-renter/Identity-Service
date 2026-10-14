import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidResetTokenException extends BaseException {
  constructor() {
    super('Password reset token is invalid', 400, 'INVALID_RESET_TOKEN');
  }
}
