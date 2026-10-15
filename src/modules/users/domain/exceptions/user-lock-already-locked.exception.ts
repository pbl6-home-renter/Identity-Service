import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserLockAlreadyLockedException extends BaseException {
  constructor() {
    super('User is already locked', 409, 'USER_LOCK_ALREADY_LOCKED');
  }
}
