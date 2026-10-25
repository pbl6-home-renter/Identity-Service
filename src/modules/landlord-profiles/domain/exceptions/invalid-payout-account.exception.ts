import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class InvalidPayoutAccountException extends DomainException {
  constructor(reason: string) {
    super(
      `Payout account is invalid: ${reason}`,
      422,
      'PAYOUT_ACCOUNT_INVALID',
    );
  }
}
