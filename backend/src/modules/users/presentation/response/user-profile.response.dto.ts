import { ApiProperty } from '@nestjs/swagger';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';

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
}
