import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../../domain/entities/user';

export class UserLockResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: Uuid;

  @ApiProperty({ enum: UserStatus, example: UserStatus.LOCKED })
  status: UserStatus;

  @ApiProperty({ example: 'Spam listing' })
  lockReason: string;

  @ApiProperty({ example: '2026-09-23T11:55:00.000Z' })
  lockedAt: Date;

  static fromDomain(user: User): UserLockResponseDto {
    const dto = new UserLockResponseDto();
    dto.userId = user.id;
    dto.status = user.status;
    dto.lockReason = user.lockReason ?? '';
    dto.lockedAt = user.lockedAt ?? new Date();
    return dto;
  }
}
