import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserLockPendingVerificationException extends DomainException {
  constructor() {
    super(
      'User must verify their email before the account can be locked',
      409,
      'EMAIL_NOT_VERIFIED',
    );
  }
}
