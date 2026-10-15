import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserUpdatePayoutNotAllowedException extends BaseException {
  constructor() {
    super(
      'Payout account is only available to landlord accounts',
      422,
      'USER_UPDATE_PAYOUT_NOT_ALLOWED',
    );
  }
}
