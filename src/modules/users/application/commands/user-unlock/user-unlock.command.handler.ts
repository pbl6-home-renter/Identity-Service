import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserUnlockCommand } from './user-unlock.command';

@CommandHandler(UserUnlockCommand)
export class UserUnlockCommandHandler implements ICommandHandler<
  UserUnlockCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UserUnlockCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.unlock();
    await this.userRepository.save(user);

    return user;
  }
}
