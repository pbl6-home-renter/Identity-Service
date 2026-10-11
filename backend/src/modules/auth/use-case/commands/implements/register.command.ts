import { ICommand } from '@nestjs/cqrs';
import { UserRole } from '../../../../users/domain/enums/user-role.enum';

export interface CreateRegisterCommandProps {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export class RegisterCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: UserRole,
  ) {}

  static create(props: CreateRegisterCommandProps): RegisterCommand {
    return new RegisterCommand(
      props.name,
      props.email,
      props.phone,
      props.password,
      props.role,
    );
  }
}
