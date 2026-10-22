import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { PayoutAccountResponseDto } from './payout-account.response.dto';
import { UserDetailResult } from '../../use-case/results/user-detail.result';

export class UserGetDetailAdminResponseDto {
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

  @ApiProperty({ type: String, example: 'Spam listing', nullable: true })
  lockReason: string | null;

  @ApiProperty({
    type: Date,
    example: '2026-09-23T11:55:00.000Z',
    nullable: true,
  })
  lockedAt: Date | null;

  @ApiProperty({ type: PayoutAccountResponseDto, nullable: true })
  payoutAccount: PayoutAccountResponseDto | null;

  @ApiProperty({ example: 0, default: 0 })
  buildingCount: number;

  @ApiProperty({ example: 1, default: 0 })
  activeContractCount: number;

  static fromResult(result: UserDetailResult): UserGetDetailAdminResponseDto {
    const dto = new UserGetDetailAdminResponseDto();
    dto.id = result.user.id;
    dto.name = result.user.name;
    dto.email = result.user.email.value;
    dto.phone = result.user.phone.value;
    dto.role = result.user.role;
    dto.status = result.user.status;
    dto.lockReason = result.user.lockReason ?? null;
    dto.lockedAt = result.user.lockedAt ?? null;
    dto.payoutAccount = result.payoutAccount
      ? PayoutAccountResponseDto.fromDomain(result.payoutAccount)
      : null;
    dto.buildingCount = result.buildingCount ?? 0;
    dto.activeContractCount = result.activeContractCount ?? 0;
    return dto;
  }
}
