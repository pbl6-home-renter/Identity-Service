import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidPayoutAccountException extends BaseException {
  constructor(reason: string) {
    super(
      `Payout account is invalid: ${reason}`,
      422,
      'PAYOUT_ACCOUNT_INVALID',
    );
  }
}
