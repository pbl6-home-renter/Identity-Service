import { UserLockInput } from '../../../application/commands/user-lock/user-lock.command';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';

export class UserLockRequestDto implements UserLockInput {
  static readonly unexpectedFieldCode = 'VALIDATION_FAILED';

  @ApiProperty({
    example: 'Spam listing',
    description: 'Reason for locking the account',
    minLength: 1,
    maxLength: 500,
  })
  @IsRequired(UserValidationMessageConstant.LOCK_REASON_REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.LOCK_REASON_MUST_BE_STRING,
  })
  @IsNotEmpty({ message: UserValidationMessageConstant.LOCK_REASON_NOT_EMPTY })
  @Length(1, 500, {
    message: UserValidationMessageConstant.LOCK_REASON.INVALID_LENGTH,
  })
  lockReason: string;
}
