import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { AuthValidationMessageConstant } from '../constants/auth-validation-message.constant';

export class ResetPasswordRequestDto {
  @ApiProperty({
    example: 'sR7pQx9Nm2Vk4...',
    minLength: 1,
    writeOnly: true,
    description: 'Opaque, single-use password reset token',
  })
  @IsRequired(AuthValidationMessageConstant.RESET_TOKEN.REQUIRED)
  @IsString({
    message: AuthValidationMessageConstant.RESET_TOKEN.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: AuthValidationMessageConstant.RESET_TOKEN.NOT_EMPTY,
  })
  @Matches(/\S/, {
    message: AuthValidationMessageConstant.RESET_TOKEN.NOT_EMPTY,
  })
  token: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    minLength: 8,
    maxLength: 255,
    writeOnly: true,
    description:
      'At least 8 characters with uppercase, lowercase and numeric characters',
  })
  @IsRequired(AuthValidationMessageConstant.PASSWORD.REQUIRED)
  @IsString({
    message: AuthValidationMessageConstant.PASSWORD.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: AuthValidationMessageConstant.PASSWORD.NOT_EMPTY,
  })
  @Length(8, 255, {
    message: AuthValidationMessageConstant.PASSWORD.INVALID_LENGTH,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: AuthValidationMessageConstant.PASSWORD.INVALID_FORMAT,
  })
  newPassword: string;
}
