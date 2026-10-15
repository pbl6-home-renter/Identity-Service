import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PhoneAlreadyExistsException } from 'shared/domain/exceptions/phone-already-exists.exception';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { UserUpdatePayloadRequiredException } from '../../../domain/exceptions/user-update-payload-required.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserUpdateAdminCommand } from '../implements/user-update-admin.command';

@CommandHandler(UserUpdateAdminCommand)
export class UserUpdateAdminCommandHandler implements ICommandHandler<
  UserUpdateAdminCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UserUpdateAdminCommand): Promise<User> {
    this.validatePayload(command);
    const user = await this.findAndValidateUser(command);
    return this.updateUserProfile(user, command);
  }

  private validatePayload(command: UserUpdateAdminCommand): void {
    if (!command.name && !command.phone) {
      throw new UserUpdatePayloadRequiredException();
    }
  }

  private async findAndValidateUser(
    command: UserUpdateAdminCommand,
  ): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (command.phone && command.phone !== user.phone) {
      const existing = await this.userRepository.findByPhone(command.phone);
      if (existing && existing.id !== user.id) {
        throw new PhoneAlreadyExistsException(command.phone);
      }
    }

    return user;
  }

  private async updateUserProfile(
    user: User,
    command: UserUpdateAdminCommand,
  ): Promise<User> {
    const updated = user.updateProfile({
      name: command.name,
      phone: command.phone,
    });

    await this.userRepository.save(updated);
    return updated;
  }
}
