import { BaseException } from 'shared/domain/exceptions/base.exception';

export class RoleNotAllowedException extends BaseException {
  constructor(role: string) {
    super(`Role "${role}" is not allowed to register`, 422, 'ROLE_NOT_ALLOWED');
  }
}
