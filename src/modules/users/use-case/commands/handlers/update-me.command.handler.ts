import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PhoneAlreadyExistsException } from 'modules/auth/domain/exceptions/phone-already-exists.exception';
import { LANDLORD_PROFILES_DI_TOKEN } from 'modules/landlord-profiles/landlord-profiles.di-token';
import { ILandlordProfileRepository } from 'modules/landlord-profiles/domain/repositories/landlord-profile.repository.interface';
import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { PayoutAccountNotAllowedException } from '../../../domain/exceptions/payout-account-not-allowed.exception';
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
    const user = await this.userRepository.findById(command.userId);
    if (!user) throw new UserNotFoundException();

    if (command.phone && command.phone !== user.phone) {
      const existing = await this.userRepository.findByPhone(command.phone);
      if (existing && existing.id !== user.id)
        throw new PhoneAlreadyExistsException(command.phone);
    }

    if (command.payoutAccount && user.role !== UserRole.LANDLORD)
      throw new PayoutAccountNotAllowedException();

    const updated = User.create({
      ...user,
      name: command.name ?? user.name,
      phone: command.phone ?? user.phone,
      updatedAt: new Date(),
    });

    await this.userRepository.save(updated);

    let payoutAccount: PayoutAccount | null = null;
    if (user.role === UserRole.LANDLORD) {
      const existingProfile = await this.landlordProfileRepository.findByUserId(
        user.id,
      );

      if (command.payoutAccount !== undefined) {
        const profileToSave = LandlordProfile.create({
          id: existingProfile?.id,
          userId: user.id,
          bankCode: command.payoutAccount?.bankCode ?? null,
          accountNumber: command.payoutAccount?.accountNumber ?? null,
          accountName: command.payoutAccount?.accountName ?? null,
          createdAt: existingProfile?.createdAt,
          updatedAt: new Date(),
          isDeleted: existingProfile?.isDeleted ?? false,
        });
        await this.landlordProfileRepository.save(profileToSave);
        payoutAccount = command.payoutAccount ?? null;
      } else if (existingProfile) {
        payoutAccount =
          existingProfile.bankCode &&
          existingProfile.accountNumber &&
          existingProfile.accountName
            ? {
                bankCode: existingProfile.bankCode,
                accountNumber: existingProfile.accountNumber,
                accountName: existingProfile.accountName,
              }
            : null;
      }
    }

    return CurrentUserProfileResult.create(updated, payoutAccount);
  }
}
