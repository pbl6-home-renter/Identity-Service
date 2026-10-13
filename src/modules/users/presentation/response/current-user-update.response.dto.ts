import { ApiProperty } from '@nestjs/swagger';
import { PayoutAccountResponseDto } from './payout-account.response.dto';
import { CurrentUserProfileResult } from '../../use-case/results/current-user-profile.result';

export class CurrentUserUpdateResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty({ minLength: 10, maxLength: 10, pattern: '^0[0-9]{9}$' })
  phone: string;
  @ApiProperty({ type: PayoutAccountResponseDto, nullable: true })
  payoutAccount: PayoutAccountResponseDto | null;
  static fromResult(
    result: CurrentUserProfileResult,
  ): CurrentUserUpdateResponseDto {
    return {
      id: result.user.id,
      name: result.user.name,
      phone: result.user.phone.replace(/^\+84/, '0'),
      payoutAccount: result.payoutAccount
        ? PayoutAccountResponseDto.fromDomain(result.payoutAccount)
        : null,
    };
  }
}
