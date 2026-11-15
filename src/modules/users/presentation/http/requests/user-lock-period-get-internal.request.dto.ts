import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { UserLockPeriodGetInternalQuery } from '../../../application/queries/user-lock-period-get-internal/user-lock-period-get-internal.query';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserLockPeriodGetInternalRequestDto {
  @ApiProperty({
    format: 'date-time',
    description: 'Original lock timestamp to reconcile.',
  })
  @IsDateString()
  lockedAt: string;

  static toQuery(
    request: UserLockPeriodGetInternalRequestDto,
    userId: Uuid,
  ): UserLockPeriodGetInternalQuery {
    return new UserLockPeriodGetInternalQuery(
      userId,
      new Date(request.lockedAt),
    );
  }
}
