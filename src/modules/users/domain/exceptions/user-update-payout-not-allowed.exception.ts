import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserUpdatePayoutNotAllowedException extends DomainException {
  constructor() {
    super(
      'Payout account is only available to landlord accounts',
      422,
      'USER_UPDATE_PAYOUT_NOT_ALLOWED',
    );
  }
}
