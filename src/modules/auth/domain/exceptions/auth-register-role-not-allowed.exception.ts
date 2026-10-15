import { BaseException } from 'shared/domain/exceptions/base.exception';

export class AuthRegisterRoleNotAllowedException extends BaseException {
  constructor(role: string) {
    super(
      `Role "${role}" is not allowed to register`,
      422,
      'AUTH_REGISTER_ROLE_NOT_ALLOWED',
    );
  }
}
