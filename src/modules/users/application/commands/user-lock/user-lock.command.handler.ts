import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserLockCannotSelfException } from '../../../domain/exceptions/user-lock-cannot-self.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserLockCommand } from './user-lock.command';
import { UserLockedEvent } from '../../../domain/events/user-locked.event';

@CommandHandler(UserLockCommand)
export class UserLockCommandHandler implements ICommandHandler<
  UserLockCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UserLockCommand): Promise<User> {
    if (command.adminId === command.userId) {
      throw new UserLockCannotSelfException();
    }

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    user.lock(command.lockReason);
    await this.userRepository.save(user);

    this.eventBus.publish(new UserLockedEvent(user.id));

    return user;
  }
}
