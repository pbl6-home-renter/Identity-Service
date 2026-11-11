import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class EmailVerificationTokenInvalidException extends DomainException {
  constructor() {
    super(
      'Email verification token is invalid or already used',
      400,
      'INVALID_EMAIL_VERIFICATION_TOKEN',
    );
  }
}
