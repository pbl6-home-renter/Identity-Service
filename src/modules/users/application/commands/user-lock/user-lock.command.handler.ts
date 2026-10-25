import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserLockCannotSelfException } from '../../../domain/exceptions/user-lock-cannot-self.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserLockCommand } from './user-lock.command';

/** Locked users keep their sessions; downstream services gate on the `status` claim. */
@CommandHandler(UserLockCommand)
export class UserLockCommandHandler implements ICommandHandler<
  UserLockCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
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
    await this.unitOfWork.run(async (context) => {
      await this.userRepository.save(user, context);

      await this.outboxRepository.append(
        user
          .pullDomainEvents()
          .map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
    });

    return user;
  }
}
