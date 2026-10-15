import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserLockCannotSelfException extends BaseException {
  constructor() {
    super('Admin cannot lock their own account', 400, 'USER_LOCK_CANNOT_SELF');
  }
}
