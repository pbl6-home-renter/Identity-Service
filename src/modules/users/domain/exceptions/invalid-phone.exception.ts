import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidPhoneException extends BaseException {
  constructor(phone: string) {
    super(`Phone "${phone}" is invalid`, 422, 'PHONE_INVALID_FORMAT');
  }
}
