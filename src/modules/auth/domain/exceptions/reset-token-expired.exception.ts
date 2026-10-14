import { BaseException } from 'shared/domain/exceptions/base.exception';

export class ResetTokenExpiredException extends BaseException {
  constructor() {
    super('Password reset token has expired', 400, 'RESET_TOKEN_EXPIRED');
  }
}
