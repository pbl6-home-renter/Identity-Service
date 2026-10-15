import { BaseException } from 'shared/domain/exceptions/base.exception';

export class AuthLoginInvalidCredentialsException extends BaseException {
  constructor() {
    super('Invalid credentials', 401, 'AUTH_LOGIN_INVALID_CREDENTIALS');
  }
}
