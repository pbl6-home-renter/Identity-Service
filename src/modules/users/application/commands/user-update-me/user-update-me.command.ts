import { ICommand } from '@nestjs/cqrs';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserUpdateMeInput {
  name?: string;
  phone?: string;
  payoutAccount?: { toDomain(): PayoutAccount } | null;
}

export class UserUpdateMeCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly name?: string,
    readonly phone?: string,
    readonly payoutAccount?: PayoutAccount | null,
  ) {}

  static create(userId: Uuid, request: UserUpdateMeInput): UserUpdateMeCommand {
    return new UserUpdateMeCommand(
      userId,
      request.name,
      request.phone,
      request.payoutAccount === null ? null : request.payoutAccount?.toDomain(),
    );
  }
}
