import { PasswordResetRequestInput } from '../../../application/commands/password-reset-request/password-reset-request.command';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { AuthValidationMessageConstant } from '../constants/auth-validation-message.constant';

export class RequestPasswordResetRequestDto implements PasswordResetRequestInput {
  @ApiProperty({
    example: 'lan@example.com',
    minLength: 5,
    maxLength: 254,
    description: 'Email address of the account to reset',
  })
  @IsRequired(AuthValidationMessageConstant.EMAIL.REQUIRED)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: AuthValidationMessageConstant.EMAIL.INVALID })
  @Length(5, 254, {
    message: AuthValidationMessageConstant.EMAIL.INVALID,
  })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: AuthValidationMessageConstant.EMAIL.INVALID,
  })
  @IsEmail({}, { message: AuthValidationMessageConstant.EMAIL.INVALID })
  email: string;
}
