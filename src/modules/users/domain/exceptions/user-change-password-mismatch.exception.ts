import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserChangePasswordMismatchException extends DomainException {
  constructor() {
    super(
      'Password confirmation does not match',
      422,
      'USER_CHANGE_PASSWORD_MISMATCH',
    );
  }
}
