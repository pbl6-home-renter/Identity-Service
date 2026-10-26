import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { PeerService } from 'shared/application/http/peer-service.enum';
import {
  PeerServiceRequestException,
  PeerServiceUnavailableException,
} from 'shared/application/http/peer-service.exception';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { LANDLORD_PROFILES_DI_TOKEN } from 'modules/landlord-profiles/landlord-profiles.di-token';
import { ILandlordProfileRepository } from 'modules/landlord-profiles/domain/repositories/landlord-profile.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserDeleteCannotSelfException } from '../../../domain/exceptions/user-delete-cannot-self.exception';
import { UserDeleteHasActiveContractException } from '../../../domain/exceptions/user-delete-has-active-contract.exception';
import { ITenancyUserStatsService } from '../../ports/tenancy-user-stats.port';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserDeleteCommand } from './user-delete.command';

@CommandHandler(UserDeleteCommand)
export class UserDeleteCommandHandler implements ICommandHandler<
  UserDeleteCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(LANDLORD_PROFILES_DI_TOKEN.REPOSITORY)
    private readonly landlordProfileRepository: ILandlordProfileRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(USERS_DI_TOKEN.TENANCY_USER_STATS)
    private readonly tenancyUserStatsService: ITenancyUserStatsService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UserDeleteCommand): Promise<void> {
    if (command.adminId === command.userId) {
      throw new UserDeleteCannotSelfException();
    }

    const user = await this.userRepository.findByIdIncludingDeleted(
      command.userId,
    );
    if (!user) {
      throw new UserNotFoundException();
    }

    user.delete();
    await this.ensureNoActiveContract(user.id);

    const events = user.pullDomainEvents();
    await this.unitOfWork.run(async (context) => {
      await this.userRepository.save(user, context);

      await this.landlordProfileRepository.softDeleteByUserId(user.id, context);

      await this.outboxRepository.append(
        events.map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
    });

    // Refresh tokens belong to the auth module, which already depends on this one,
    // so they are revoked in-process once the deletion is committed.
    this.eventBus.publishAll(events);
  }

  /** Fails closed: if Tenancy-Service cannot confirm, the user is not deleted. */
  private async ensureNoActiveContract(userId: Uuid): Promise<void> {
    let activeContractCount: number;
    try {
      ({ activeContractCount } =
        await this.tenancyUserStatsService.getUserStats(userId));
    } catch (error) {
      if (error instanceof PeerServiceRequestException) {
        throw new PeerServiceUnavailableException(
          PeerService.TENANCY,
          error.code,
        );
      }
      throw error;
    }

    if (activeContractCount > 0) {
      throw new UserDeleteHasActiveContractException();
    }
  }
}
