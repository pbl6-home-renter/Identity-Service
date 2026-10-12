import { BaseException } from 'shared/domain/exceptions/base.exception';

export class PayoutAccountNotAllowedException extends BaseException {
  constructor() {
    super(
      'Payout account is only available to landlord accounts',
      403,
      'PAYOUT_ACCOUNT_NOT_ALLOWED',
    );
  }
}
