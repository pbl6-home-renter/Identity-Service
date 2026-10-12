import { ICommand } from '@nestjs/cqrs';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UpdateMeRequestDto } from '../../../presentation/request/update-me.request.dto';

export class UpdateMeCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly name?: string,
    readonly phone?: string,
    readonly payoutAccount?: PayoutAccount,
  ) {}

  static create(userId: Uuid, request: UpdateMeRequestDto): UpdateMeCommand {
    return new UpdateMeCommand(
      userId,
      request.name,
      request.phone,
      request.payoutAccount?.toDomain(),
    );
  }
}
