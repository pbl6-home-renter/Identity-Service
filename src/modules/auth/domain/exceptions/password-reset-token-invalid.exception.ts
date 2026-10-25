import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class PasswordResetTokenInvalidException extends DomainException {
  constructor() {
    super('Password reset token does not exist', 422, 'INVALID_TOKEN');
  }
}
