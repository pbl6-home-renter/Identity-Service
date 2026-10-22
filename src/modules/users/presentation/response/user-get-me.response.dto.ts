import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';
import { CurrentUserProfileResult } from '../../use-case/results/current-user-profile.result';
import { PayoutAccountResponseDto } from './payout-account.response.dto';

export class UserGetMeResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: Uuid;

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
  ): UserGetMeResponseDto {
    const dto = new UserGetMeResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email.value;
    dto.phone = user.phone.value;
    dto.role = user.role;
    dto.status = user.status;
    dto.payoutAccount = payoutAccount
      ? PayoutAccountResponseDto.fromDomain(payoutAccount)
      : null;
    return dto;
  }

  static fromResult(result: CurrentUserProfileResult): UserGetMeResponseDto {
    return UserGetMeResponseDto.create(result.user, result.payoutAccount);
  }
}
