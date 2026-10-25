import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PhoneAlreadyExistsException } from '../../../domain/exceptions/phone-already-exists.exception';
import { LANDLORD_PROFILES_DI_TOKEN } from 'modules/landlord-profiles/landlord-profiles.di-token';
import { ILandlordProfileRepository } from 'modules/landlord-profiles/domain/repositories/landlord-profile.repository.interface';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { UserUpdatePayoutNotAllowedException } from '../../../domain/exceptions/user-update-payout-not-allowed.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { UserUpdateMeCommand } from './user-update-me.command';
import { Phone } from '../../../domain/value-objects/phone.vo';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { DomainEvent } from 'shared/domain/base/domain-event';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';

@CommandHandler(UserUpdateMeCommand)
export class UserUpdateMeCommandHandler implements ICommandHandler<
  UserUpdateMeCommand,
  CurrentUserProfileResult
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
  ) {}

  async execute(
    command: UserUpdateMeCommand,
  ): Promise<CurrentUserProfileResult> {
    const phone = command.phone ? Phone.create(command.phone) : undefined;
    const user = await this.findAndValidateUser(command, phone);
    const updatedUser = user.updateProfile({ name: command.name, phone });
    const profile = await this.buildLandlordProfile(
      updatedUser,
      command.payoutAccount,
    );

    await this.unitOfWork.run(async (context) => {
      await this.userRepository.save(updatedUser, context);
      if (profile) {
        await this.landlordProfileRepository.save(profile, context);
      }

      await this.appendEvents(
        [
          ...updatedUser.pullDomainEvents(),
          ...(profile?.pullDomainEvents() ?? []),
        ],
        context,
      );
    });

    const payoutAccount = profile
      ? profile.payoutAccount
      : await this.currentPayoutAccount(updatedUser);

    return CurrentUserProfileResult.create(updatedUser, payoutAccount);
  }

  private async findAndValidateUser(
    command: UserUpdateMeCommand,
    phone: Phone | undefined,
  ): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (phone && !phone.equals(user.phone)) {
      const existing = await this.userRepository.findByPhone(phone);
      if (existing && existing.id !== user.id) {
        throw new PhoneAlreadyExistsException(phone.value);
      }
    }

    if (command.payoutAccount && user.role !== UserRole.LANDLORD) {
      throw new UserUpdatePayoutNotAllowedException();
    }

    return user;
  }

  /** Only built when a landlord sends `payoutAccount`; otherwise nothing is upserted. */
  private async buildLandlordProfile(
    user: User,
    payoutAccount?: PayoutAccount | null,
  ): Promise<LandlordProfile | null> {
    if (user.role !== UserRole.LANDLORD || payoutAccount === undefined) {
      return null;
    }

    const existing = await this.landlordProfileRepository.findByUserId(user.id);
    return LandlordProfile.withPayoutAccount(existing, user.id, payoutAccount);
  }

  private async currentPayoutAccount(
    user: User,
  ): Promise<PayoutAccount | null> {
    if (user.role !== UserRole.LANDLORD) {
      return null;
    }

    const profile = await this.landlordProfileRepository.findByUserId(user.id);
    return profile?.payoutAccount ?? null;
  }

  private async appendEvents(
    events: DomainEvent[],
    context: TransactionContext,
  ): Promise<void> {
    await this.outboxRepository.append(
      events.map((event) => OutboxMessage.fromDomainEvent(event)),
      context,
    );
  }
}
