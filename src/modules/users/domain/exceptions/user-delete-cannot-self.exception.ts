import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserDeleteCannotSelfException extends DomainException {
  constructor() {
    super(
      'Admin cannot delete their own account',
      400,
      'USER_DELETE_CANNOT_SELF',
    );
  }
}
