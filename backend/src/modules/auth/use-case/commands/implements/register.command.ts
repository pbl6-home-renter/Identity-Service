import { ICommand } from '@nestjs/cqrs';
import { UserRole } from '../../../../users/domain/enums/user-role.enum';
import { RegisterRequestDto } from '../../../presentation/request/register.request.dto';

export class RegisterCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: UserRole,
  ) {}

  static create(request: RegisterRequestDto): RegisterCommand {
    return new RegisterCommand(
      request.name,
      request.email,
      request.phone,
      request.password,
      request.role,
    );
  }
}
