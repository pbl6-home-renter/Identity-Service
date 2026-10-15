import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PhoneAlreadyExistsException } from 'shared/domain/exceptions/phone-already-exists.exception';
import { LANDLORD_PROFILES_DI_TOKEN } from 'modules/landlord-profiles/landlord-profiles.di-token';
import { ILandlordProfileRepository } from 'modules/landlord-profiles/domain/repositories/landlord-profile.repository.interface';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { UserUpdatePayoutNotAllowedException } from '../../../domain/exceptions/user-update-payout-not-allowed.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { UserUpdateMeCommand } from '../implements/user-update-me.command';

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
  ) {}

  async execute(
    command: UserUpdateMeCommand,
  ): Promise<CurrentUserProfileResult> {
    const user = await this.findAndValidateUser(command);
    const updatedUser = await this.updateUserBasicInfo(user, command);
    const payoutAccount = await this.handleLandlordPayout(
      user,
      command.payoutAccount,
    );

    return CurrentUserProfileResult.create(updatedUser, payoutAccount);
  }

  private async findAndValidateUser(
    command: UserUpdateMeCommand,
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

    if (command.payoutAccount && user.role !== UserRole.LANDLORD) {
      throw new UserUpdatePayoutNotAllowedException();
    }

    return user;
  }

  private async updateUserBasicInfo(
    user: User,
    command: UserUpdateMeCommand,
  ): Promise<User> {
    const updated = user.updateProfile({
      name: command.name,
      phone: command.phone,
    });

    await this.userRepository.save(updated);
    return updated;
  }

  private async handleLandlordPayout(
    user: User,
    payoutAccountDto?: PayoutAccount | null,
  ): Promise<PayoutAccount | null> {
    if (user.role !== UserRole.LANDLORD) {
      return null;
    }

    const existingProfile = await this.landlordProfileRepository.findByUserId(
      user.id,
    );

    if (payoutAccountDto !== undefined) {
      const profileToSave = LandlordProfile.create({
        id: existingProfile?.id,
        userId: user.id,
        bankCode: payoutAccountDto?.bankCode ?? null,
        accountNumber: payoutAccountDto?.accountNumber ?? null,
        accountName: payoutAccountDto?.accountName ?? null,
        createdAt: existingProfile?.createdAt,
        updatedAt: new Date(),
        isDeleted: existingProfile?.isDeleted ?? false,
      });
      await this.landlordProfileRepository.save(profileToSave);
      return payoutAccountDto ?? null;
    }

    if (
      existingProfile?.bankCode &&
      existingProfile.accountNumber &&
      existingProfile.accountName
    ) {
      return {
        bankCode: existingProfile.bankCode,
        accountNumber: existingProfile.accountNumber,
        accountName: existingProfile.accountName,
      };
    }

    return null;
  }
}
