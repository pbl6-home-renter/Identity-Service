import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserNotFoundException extends BaseException {
  constructor() {
    super('User not found', 404, 'RESOURCE_NOT_FOUND');
  }
}
