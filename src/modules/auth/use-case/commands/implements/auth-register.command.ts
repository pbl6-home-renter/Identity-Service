import { ICommand } from '@nestjs/cqrs';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { AuthRegisterRequestDto } from '../../../presentation/request/auth-register.request.dto';

export class AuthRegisterCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: UserRole,
  ) {}

  static create(request: AuthRegisterRequestDto): AuthRegisterCommand {
    return new AuthRegisterCommand(
      request.name,
      request.email,
      request.phone,
      request.password,
      request.role,
    );
  }
}
