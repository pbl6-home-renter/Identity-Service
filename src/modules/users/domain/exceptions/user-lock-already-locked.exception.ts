import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserLockAlreadyLockedException extends DomainException {
  constructor() {
    super('User is already locked', 409, 'USER_LOCK_ALREADY_LOCKED');
  }
}
