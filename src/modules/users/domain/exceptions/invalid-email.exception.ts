import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidEmailException extends BaseException {
  constructor(email: string) {
    super(`Email "${email}" is invalid`, 422, 'EMAIL_INVALID_FORMAT');
  }
}
