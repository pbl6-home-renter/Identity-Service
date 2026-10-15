import { BaseException } from './base.exception';

export class PhoneAlreadyExistsException extends BaseException {
  constructor(phone: string) {
    super(`Phone "${phone}" already exists`, 409, 'DUPLICATE_PHONE');
  }
}
