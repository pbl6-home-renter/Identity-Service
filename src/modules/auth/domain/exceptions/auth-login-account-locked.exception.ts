import { BaseException } from 'shared/domain/exceptions/base.exception';

export class AuthLoginAccountLockedException extends BaseException {
  constructor(reason?: string | null) {
    super(
      reason ? `Account is locked: ${reason}` : 'Account is locked',
      403,
      'AUTH_LOGIN_ACCOUNT_LOCKED',
    );
  }
}
