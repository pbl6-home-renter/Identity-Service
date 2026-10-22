import { ICommand } from '@nestjs/cqrs';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserUpdateMeRequestDto } from '../../../presentation/request/user-update-me.request.dto';

export class UserUpdateMeCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly name?: string,
    readonly phone?: string,
    readonly payoutAccount?: PayoutAccount | null,
  ) {}

  static create(
    userId: Uuid,
    request: UserUpdateMeRequestDto,
  ): UserUpdateMeCommand {
    return new UserUpdateMeCommand(
      userId,
      request.name,
      request.phone,
      request.payoutAccount === null ? null : request.payoutAccount?.toDomain(),
    );
  }
}
