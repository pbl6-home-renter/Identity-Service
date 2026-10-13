import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PhoneAlreadyExistsException } from 'modules/auth/domain/exceptions/phone-already-exists.exception';
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
    const payoutAccount = await this.userRepository.saveProfile(
      updated,
      command.payoutAccount,
    );
    return CurrentUserProfileResult.create(updated, payoutAccount);
  }
}
