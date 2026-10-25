import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserChangePasswordInvalidCurrentException extends DomainException {
  constructor() {
    super(
      'Current password is invalid',
      401,
      'USER_CHANGE_PASSWORD_INVALID_CURRENT',
    );
  }
}
