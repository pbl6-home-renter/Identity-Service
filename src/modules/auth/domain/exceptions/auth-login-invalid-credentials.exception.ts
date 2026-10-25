import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AuthLoginInvalidCredentialsException extends DomainException {
  constructor() {
    super('Invalid credentials', 401, 'AUTH_LOGIN_INVALID_CREDENTIALS');
  }
}
