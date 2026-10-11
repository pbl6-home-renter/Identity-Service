import { BaseException } from 'shared/domain/exceptions/base.exception';

export class AccountLockedException extends BaseException {
  constructor(reason?: string | null) {
    super(
      reason ? `Account is locked: ${reason}` : 'Account is locked',
      403,
      'ACCOUNT_LOCKED',
    );
  }
}
