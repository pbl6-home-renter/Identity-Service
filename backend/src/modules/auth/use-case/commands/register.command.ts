import { ICommand } from '@nestjs/cqrs';
import { UserRole } from '../../../users/domain/enums/user-role.enum';

export class RegisterCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: UserRole,
  ) {}
}
