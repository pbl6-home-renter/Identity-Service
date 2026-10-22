import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PayoutAccountResponseDto } from './payout-account.response.dto';
import { CurrentUserProfileResult } from '../../use-case/results/current-user-profile.result';

export class UserUpdateMeResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: Uuid;
  @ApiProperty() name: string;
  @ApiProperty({ minLength: 10, maxLength: 10, pattern: '^0[0-9]{9}$' })
  phone: string;
  @ApiProperty({ type: PayoutAccountResponseDto, nullable: true })
  payoutAccount: PayoutAccountResponseDto | null;
  static fromResult(result: CurrentUserProfileResult): UserUpdateMeResponseDto {
    return {
      id: result.user.id,
      name: result.user.name,
      phone: result.user.phone.value,
      payoutAccount: result.payoutAccount
        ? PayoutAccountResponseDto.fromDomain(result.payoutAccount)
        : null,
    };
  }
}
