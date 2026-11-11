import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class EmailVerificationTokenExpiredException extends DomainException {
  constructor() {
    super(
      'Email verification token has expired',
      409,
      'EMAIL_VERIFICATION_TOKEN_EXPIRED',
    );
  }
}
