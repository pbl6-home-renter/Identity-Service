import { ApiProperty } from '@nestjs/swagger';
import { UserLockPeriodGetInternalResult } from '../../../application/queries/user-lock-period-get-internal/user-lock-period-get-internal.result';

export class UserLockPeriodGetInternalResponseDto {
  @ApiProperty({ format: 'date-time' })
  lockedAt: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  unlockedAt: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  latestLockedAt: string | null;
  @ApiProperty({ format: 'date-time' })
  observedAt: string;
  @ApiProperty({ enum: ['locked', 'unlocked', 'unknown'] })
  state: 'locked' | 'unlocked' | 'unknown';

  static fromResult(
    result: UserLockPeriodGetInternalResult,
  ): UserLockPeriodGetInternalResponseDto {
    return Object.assign(new UserLockPeriodGetInternalResponseDto(), result);
  }
}
