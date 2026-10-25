import { ICommand } from '@nestjs/cqrs';
import { UserRole } from 'shared/domain/enums/user-role.enum';

/** Fields the caller supplies; the request DTO implements this. */
export interface AuthRegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export class AuthRegisterCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: UserRole,
  ) {}

  static create(request: AuthRegisterInput): AuthRegisterCommand {
    return new AuthRegisterCommand(
      request.name,
      request.email,
      request.phone,
      request.password,
      request.role,
    );
  }
}
