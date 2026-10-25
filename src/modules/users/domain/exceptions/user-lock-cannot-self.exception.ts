import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserLockCannotSelfException extends DomainException {
  constructor() {
    super('Admin cannot lock their own account', 400, 'USER_LOCK_CANNOT_SELF');
  }
}
