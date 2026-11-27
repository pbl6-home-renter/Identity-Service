import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { Audited } from 'modules/audit/application/audited.decorator';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserUnlockedByAdminEvent } from '../../events/user-unlocked-by-admin.event';
import { UserUnlockCommand } from './user-unlock.command';

@CommandHandler(UserUnlockCommand)
export class UserUnlockCommandHandler implements ICommandHandler<
  UserUnlockCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Audited<UserUnlockCommand, User>({
    action: 'user.unlocked',
    entityType: 'user',
    actorId: (command) => command.adminId,
    entityId: (command) => command.userId,
    metadata: () => ({}),
  })
  async execute(command: UserUnlockCommand): Promise<User> {
    const unlocked = await this.unitOfWork.run(async (context) => {
      const user = await this.userRepository.findByIdForUpdate(
        command.userId,
        context,
      );
      if (!user) {
        throw new UserNotFoundException();
      }

      const lockedAt = user.lockedAt;
      const unlockedAt = new Date();
      user.unlock(unlockedAt);
      await this.userRepository.save(user, context);
      if (lockedAt) {
        await this.userRepository.recordUnlockPeriod(
          user.id,
          lockedAt,
          unlockedAt,
          context,
        );
      }

      await this.outboxRepository.append(
        user
          .pullDomainEvents()
          .map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
      return user;
    });
    this.eventBus.publish(
      new UserUnlockedByAdminEvent(unlocked.id, command.adminId),
    );
    return unlocked;
  }
}
