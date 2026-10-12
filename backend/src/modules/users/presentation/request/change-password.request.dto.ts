import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';

export class ChangePasswordRequestDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsRequired(UserValidationMessageConstant.CURRENT_PASSWORD_REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.CURRENT_PASSWORD_MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.CURRENT_PASSWORD_NOT_EMPTY,
  })
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword456!', minLength: 8 })
  @IsRequired(UserValidationMessageConstant.NEW_PASSWORD_REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.NEW_PASSWORD_MUST_BE_STRING,
  })
  @IsNotEmpty({ message: UserValidationMessageConstant.NEW_PASSWORD_NOT_EMPTY })
  @Length(8, 255, {
    message: UserValidationMessageConstant.NEW_PASSWORD_INVALID_LENGTH,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: UserValidationMessageConstant.NEW_PASSWORD_INVALID_FORMAT,
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsRequired(UserValidationMessageConstant.CONFIRM_PASSWORD_REQUIRED)
  @IsString({
    message: UserValidationMessageConstant.CONFIRM_PASSWORD_MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.CONFIRM_PASSWORD_NOT_EMPTY,
  })
  confirmPassword: string;
}
