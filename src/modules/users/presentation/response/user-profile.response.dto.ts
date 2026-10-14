import { ApiProperty } from '@nestjs/swagger';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';
import { CurrentUserProfileResult } from '../../use-case/results/current-user-profile.result';
import { PayoutAccountResponseDto } from './payout-account.response.dto';

export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Lê Văn An' })
  name: string;

  @ApiProperty({ example: 'lan@example.com' })
  email: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ type: PayoutAccountResponseDto, nullable: true })
  payoutAccount: PayoutAccountResponseDto | null;

  static create(
    user: User,
    payoutAccount: PayoutAccount | null,
  ): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.status = user.status;
    dto.payoutAccount = payoutAccount
      ? PayoutAccountResponseDto.fromDomain(payoutAccount)
      : null;
    return dto;
  }

  static fromResult(result: CurrentUserProfileResult): UserProfileResponseDto {
    return UserProfileResponseDto.create(result.user, result.payoutAccount);
  }
}
