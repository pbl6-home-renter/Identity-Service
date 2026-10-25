import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class PasswordResetTokenExpiredException extends DomainException {
  constructor() {
    super('Password reset token has expired', 409, 'TOKEN_EXPIRED');
  }
}
