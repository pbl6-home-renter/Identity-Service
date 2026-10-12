import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidCurrentPasswordException extends BaseException {
  constructor() {
    super('Current password is invalid', 400, 'INVALID_CURRENT_PASSWORD');
  }
}
