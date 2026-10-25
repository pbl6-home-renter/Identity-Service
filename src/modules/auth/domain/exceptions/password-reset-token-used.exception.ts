import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class PasswordResetTokenUsedException extends DomainException {
  constructor() {
    super(
      'Password reset token is invalid or has already been used',
      409,
      'TOKEN_USED',
    );
  }
}
