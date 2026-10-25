import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AuthLoginAccountLockedException extends DomainException {
  constructor(reason?: string | null) {
    super(
      reason ? `Account is locked: ${reason}` : 'Account is locked',
      403,
      'AUTH_LOGIN_ACCOUNT_LOCKED',
    );
  }
}
