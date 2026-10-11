import { ICommand } from '@nestjs/cqrs';

export class LoginCommand implements ICommand {
  constructor(
    public readonly identifier: string,
    public readonly password: string,
    public readonly rememberMe: boolean = true,
  ) {}
}
