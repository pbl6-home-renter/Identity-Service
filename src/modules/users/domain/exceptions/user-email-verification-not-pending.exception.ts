import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserEmailVerificationNotPendingException extends DomainException {
  constructor() {
    super(
      'User account is not awaiting email verification',
      409,
      'EMAIL_VERIFICATION_NOT_PENDING',
    );
  }
}
