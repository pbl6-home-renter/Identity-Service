import { InvalidPayoutAccountException } from '../exceptions/invalid-payout-account.exception';

export class PayoutAccount {
  private constructor(
    readonly bankCode: string,
    readonly accountNumber: string,
    readonly accountName: string,
  ) {}

  static create(
    props: Pick<PayoutAccount, 'bankCode' | 'accountNumber' | 'accountName'>,
  ): PayoutAccount {
    const bankCode = props.bankCode.trim();
    const accountNumber = props.accountNumber.trim();
    const accountName = props.accountName.trim();

    if (bankCode.length < 4 || bankCode.length > 20) {
      throw new InvalidPayoutAccountException(
        `bankCode must be 4-20 characters, got "${bankCode}"`,
      );
    }

    if (!/^[0-9]{6,20}$/.test(accountNumber)) {
      throw new InvalidPayoutAccountException(
        'accountNumber must be 6-20 digits',
      );
    }

    if (accountName.length < 1 || accountName.length > 254) {
      throw new InvalidPayoutAccountException(
        'accountName must be 1-254 characters',
      );
    }

    return new PayoutAccount(bankCode, accountNumber, accountName);
  }

  equals(other: PayoutAccount): boolean {
    return (
      this.bankCode === other.bankCode &&
      this.accountNumber === other.accountNumber &&
      this.accountName === other.accountName
    );
  }
}
