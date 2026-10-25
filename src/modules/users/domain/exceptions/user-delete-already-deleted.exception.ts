import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserDeleteAlreadyDeletedException extends DomainException {
  constructor() {
    super('User is already deleted', 409, 'USER_DELETE_ALREADY_DELETED');
  }
}
