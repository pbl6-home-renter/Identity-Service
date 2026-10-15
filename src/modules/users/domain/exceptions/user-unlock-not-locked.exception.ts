import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserUnlockNotLockedException extends BaseException {
  constructor() {
    super('User is not locked', 409, 'USER_UNLOCK_NOT_LOCKED');
  }
}
