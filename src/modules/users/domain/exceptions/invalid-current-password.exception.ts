import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidCurrentPasswordException extends BaseException {
  constructor() {
    super('Current password is invalid', 401, 'INVALID_CREDENTIALS');
  }
}
