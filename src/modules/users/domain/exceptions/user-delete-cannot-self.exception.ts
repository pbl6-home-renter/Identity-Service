import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserDeleteCannotSelfException extends BaseException {
  constructor() {
    super(
      'Admin cannot delete their own account',
      400,
      'USER_DELETE_CANNOT_SELF',
    );
  }
}
