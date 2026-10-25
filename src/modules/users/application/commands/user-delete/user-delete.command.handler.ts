import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserDeleteCannotSelfException } from '../../../domain/exceptions/user-delete-cannot-self.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserDeleteCommand } from './user-delete.command';
import { UserDeletedEvent } from '../../../domain/events/user-deleted.event';

@CommandHandler(UserDeleteCommand)
export class UserDeleteCommandHandler implements ICommandHandler<
  UserDeleteCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UserDeleteCommand): Promise<void> {
    if (command.adminId === command.userId) {
      throw new UserDeleteCannotSelfException();
    }

    await this.userRepository.delete(command.userId);
    this.eventBus.publish(new UserDeletedEvent(command.userId));
  }
}
