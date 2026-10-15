import { ICommand } from '@nestjs/cqrs';
import { AuthLoginRequestDto } from '../../../presentation/request/auth-login.request.dto';

export class AuthLoginCommand implements ICommand {
  constructor(
    public readonly identifier: string,
    public readonly password: string,
    public readonly rememberMe: boolean = true,
  ) {}

  static create(request: AuthLoginRequestDto): AuthLoginCommand {
    return new AuthLoginCommand(
      request.identifier,
      request.password,
      request.rememberMe ?? true,
    );
  }
}
