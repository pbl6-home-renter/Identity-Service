import { ICommand } from '@nestjs/cqrs';

/** Fields the caller supplies; the request DTO implements this. */
export interface AuthLoginInput {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export class AuthLoginCommand implements ICommand {
  constructor(
    public readonly identifier: string,
    public readonly password: string,
    public readonly rememberMe: boolean = true,
  ) {}

  static create(request: AuthLoginInput): AuthLoginCommand {
    return new AuthLoginCommand(
      request.identifier,
      request.password,
      request.rememberMe ?? true,
    );
  }
}
