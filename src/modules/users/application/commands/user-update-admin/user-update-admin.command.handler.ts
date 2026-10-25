import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { PhoneAlreadyExistsException } from '../../../domain/exceptions/phone-already-exists.exception';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { UserUpdatePayloadRequiredException } from '../../../domain/exceptions/user-update-payload-required.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserUpdateAdminCommand } from './user-update-admin.command';
import { Phone } from '../../../domain/value-objects/phone.vo';

@CommandHandler(UserUpdateAdminCommand)
export class UserUpdateAdminCommandHandler implements ICommandHandler<
  UserUpdateAdminCommand,
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

  async execute(command: UserUpdateAdminCommand): Promise<User> {
    this.validatePayload(command);
    const phone = command.phone ? Phone.create(command.phone) : undefined;
    const user = await this.findAndValidateUser(command, phone);
    return this.updateUserProfile(user, command, phone);
  }

  private validatePayload(command: UserUpdateAdminCommand): void {
    if (!command.name && !command.phone) {
      throw new UserUpdatePayloadRequiredException();
    }
  }

  private async findAndValidateUser(
    command: UserUpdateAdminCommand,
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

    return user;
  }

  private async updateUserProfile(
    user: User,
    command: UserUpdateAdminCommand,
    phone: Phone | undefined,
  ): Promise<User> {
    const updated = user.updateProfile({
      name: command.name,
      phone,
    });

    await this.unitOfWork.run(async (context) => {
      await this.userRepository.save(updated, context);

      await this.outboxRepository.append(
        updated
          .pullDomainEvents()
          .map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
    });

    return updated;
  }
}
