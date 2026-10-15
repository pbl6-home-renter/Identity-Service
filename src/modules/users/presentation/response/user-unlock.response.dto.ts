import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';

export class UserUnlockResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: Uuid;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ type: Date, example: null, nullable: true })
  lockedAt: Date | null;

  static fromDomain(user: User): UserUnlockResponseDto {
    const dto = new UserUnlockResponseDto();
    dto.userId = user.id;
    dto.status = user.status;
    dto.lockedAt = null;
    return dto;
  }
}
