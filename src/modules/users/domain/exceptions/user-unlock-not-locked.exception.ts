import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserUnlockNotLockedException extends DomainException {
  constructor() {
    super('User is not locked', 409, 'USER_UNLOCK_NOT_LOCKED');
  }
}
