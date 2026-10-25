import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AuthRegisterRoleNotAllowedException extends DomainException {
  constructor(role: string) {
    super(
      `Role "${role}" is not allowed to register`,
      422,
      'AUTH_REGISTER_ROLE_NOT_ALLOWED',
    );
  }
}
