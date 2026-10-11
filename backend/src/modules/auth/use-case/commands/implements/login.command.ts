import { ICommand } from '@nestjs/cqrs';
import { LoginRequestDto } from '../../../presentation/request/login.request.dto';

export class LoginCommand implements ICommand {
  constructor(
    public readonly identifier: string,
    public readonly password: string,
    public readonly rememberMe: boolean = true,
  ) {}

  static create(request: LoginRequestDto): LoginCommand {
    return new LoginCommand(
      request.identifier,
      request.password,
      request.rememberMe ?? true,
    );
  }
}
