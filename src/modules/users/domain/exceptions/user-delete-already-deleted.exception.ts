import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserDeleteAlreadyDeletedException extends BaseException {
  constructor() {
    super('User is already deleted', 409, 'USER_DELETE_ALREADY_DELETED');
  }
}
