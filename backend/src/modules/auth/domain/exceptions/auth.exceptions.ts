import { BaseException } from 'shared/domain/exceptions/base.exception';

export class EmailAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`Email "${email}" already exists`, 409, 'EMAIL_ALREADY_EXISTS');
  }
}

export class PhoneAlreadyExistsException extends BaseException {
  constructor(phone: string) {
    super(`Phone "${phone}" already exists`, 409, 'PHONE_ALREADY_EXISTS');
  }
}

export class InvalidCredentialsException extends BaseException {
  constructor() {
    super('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
}

export class AccountLockedException extends BaseException {
  constructor(reason?: string | null) {
    super(
      reason ? `Account is locked: ${reason}` : 'Account is locked',
      403,
      'ACCOUNT_LOCKED',
    );
  }
}

export class RoleNotAllowedException extends BaseException {
  constructor(role: string) {
    super(`Role "${role}" is not allowed to register`, 422, 'ROLE_NOT_ALLOWED');
  }
}
