import { BaseException } from 'shared/domain/exceptions/base.exception';

export class PhoneAlreadyExistsException extends BaseException {
  constructor(phone: string) {
    super(`Phone "${phone}" already exists`, 409, 'PHONE_ALREADY_EXISTS');
  }
}
