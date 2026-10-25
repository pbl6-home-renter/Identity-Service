import { UserChangePasswordInput } from '../../../application/commands/user-change-password/user-change-password.command';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';

export class UserChangePasswordRequestDto implements UserChangePasswordInput {
  @ApiProperty({ example: 'OldPassword123!', minLength: 1 })
  @IsRequired(UserValidationMessageConstant.CURRENT_PASSWORD.REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.CURRENT_PASSWORD.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.CURRENT_PASSWORD.NOT_EMPTY,
  })
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword456!', minLength: 1 })
  @IsRequired(UserValidationMessageConstant.NEW_PASSWORD.REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.NEW_PASSWORD.MUST_BE_STRING,
  })
  @IsNotEmpty({ message: UserValidationMessageConstant.NEW_PASSWORD.NOT_EMPTY })
  @Length(8, 255, {
    message: UserValidationMessageConstant.NEW_PASSWORD.INVALID_LENGTH,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: UserValidationMessageConstant.NEW_PASSWORD.INVALID_FORMAT,
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPassword456!', minLength: 1 })
  @IsRequired(UserValidationMessageConstant.CONFIRM_PASSWORD.REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.CONFIRM_PASSWORD.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.CONFIRM_PASSWORD.NOT_EMPTY,
  })
  confirmPassword: string;
}
