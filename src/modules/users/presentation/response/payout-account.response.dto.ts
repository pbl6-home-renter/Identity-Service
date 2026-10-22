import { ApiProperty } from '@nestjs/swagger';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';

export class PayoutAccountResponseDto {
  @ApiProperty({ example: '970422' })
  bankCode: string;

  @ApiProperty({ example: '**43210' })
  accountNumber: string;

  @ApiProperty({ example: 'LE VAN AN' })
  accountName: string;

  static fromDomain(payoutAccount: PayoutAccount): PayoutAccountResponseDto {
    const dto = new PayoutAccountResponseDto();
    dto.bankCode = payoutAccount.bankCode;
    dto.accountNumber = `**${payoutAccount.accountNumber.slice(-5)}`;
    dto.accountName = payoutAccount.accountName;
    return dto;
  }
}
