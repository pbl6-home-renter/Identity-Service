import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { LANDLORD_PROFILES_DI_TOKEN } from 'modules/landlord-profiles/landlord-profiles.di-token';
import { ILandlordProfileRepository } from 'modules/landlord-profiles/domain/repositories/landlord-profile.repository.interface';
import { PhoneAlreadyExistsException } from 'modules/auth/domain/exceptions/phone-already-exists.exception';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { User } from '../../../domain/entities/user';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PayoutAccountNotAllowedException } from '../../../domain/exceptions/payout-account-not-allowed.exception';
import { UpdatePayloadRequiredException } from '../../../domain/exceptions/update-payload-required.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';
import { UpdateMeCommand } from '../implements/update-me.command';

@CommandHandler(UpdateMeCommand)
export class UpdateMeCommandHandler implements ICommandHandler<
  UpdateMeCommand,
  CurrentUserProfileResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(LANDLORD_PROFILES_DI_TOKEN.REPOSITORY)
    private readonly landlordProfileRepository: ILandlordProfileRepository,
  ) {}

  async execute(command: UpdateMeCommand): Promise<CurrentUserProfileResult> {
    const { name, phone, payoutAccount } = command;
    if (name === undefined && phone === undefined && !payoutAccount) {
      throw new UpdatePayloadRequiredException();
    }

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (phone && phone !== user.phone) {
      const existingUser = await this.userRepository.findByPhone(phone);
      if (existingUser && existingUser.id !== user.id) {
        throw new PhoneAlreadyExistsException(phone);
      }
    }

    if (payoutAccount && user.role !== UserRole.LANDLORD) {
      throw new PayoutAccountNotAllowedException();
    }

    const updatedUser = User.create({
      id: user.id,
      phone: phone ?? user.phone,
      email: user.email,
      password: user.password,
      name: name ?? user.name,
      role: user.role,
      status: user.status,
      lockReason: user.lockReason,
      lockedAt: user.lockedAt,
      createdAt: user.createdAt,
      updatedAt: new Date(),
      isDeleted: user.isDeleted,
    });
    if (name !== undefined || phone !== undefined) {
      await this.userRepository.save(updatedUser);
    }

    const updatedPayoutAccount =
      user.role === UserRole.LANDLORD
        ? await this.updatePayoutAccount(user.id, payoutAccount)
        : null;

    return CurrentUserProfileResult.create(updatedUser, updatedPayoutAccount);
  }

  private async updatePayoutAccount(
    userId: Uuid,
    payoutAccount?: PayoutAccount,
  ): Promise<PayoutAccount | null> {
    const profile = await this.landlordProfileRepository.findByUserId(userId);

    if (!payoutAccount) {
      return this.toPayoutAccount(profile);
    }

    const updatedProfile = profile
      ? LandlordProfile.create({
          id: profile.id,
          userId: profile.userId,
          bankCode: payoutAccount.bankCode,
          accountNumber: payoutAccount.accountNumber,
          accountName: payoutAccount.accountName,
          createdAt: profile.createdAt,
          updatedAt: new Date(),
          isDeleted: profile.isDeleted,
        })
      : LandlordProfile.create({
          userId,
          bankCode: payoutAccount.bankCode,
          accountNumber: payoutAccount.accountNumber,
          accountName: payoutAccount.accountName,
        });

    await this.landlordProfileRepository.save(updatedProfile);
    return payoutAccount;
  }

  private toPayoutAccount(
    profile: LandlordProfile | null,
  ): PayoutAccount | null {
    if (!profile?.bankCode || !profile.accountNumber || !profile.accountName) {
      return null;
    }

    return {
      bankCode: profile.bankCode,
      accountNumber: profile.accountNumber,
      accountName: profile.accountName,
    };
  }
}
