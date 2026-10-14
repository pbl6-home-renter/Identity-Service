import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { RegisterCommand } from '../../use-case/commands/implements/register.command';
import { AuthValidationMessageConstant } from '../constants/auth-validation-message.constant';

export class RegisterRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email address according to RFC 5322',
  })
  @IsRequired(AuthValidationMessageConstant.EMAIL.REQUIRED)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: AuthValidationMessageConstant.EMAIL.MUST_BE_STRING })
  @IsNotEmpty({ message: AuthValidationMessageConstant.EMAIL.NOT_EMPTY })
  @Length(5, 254, {
    message: AuthValidationMessageConstant.EMAIL.INVALID_LENGTH,
  })
  @IsEmail({}, { message: AuthValidationMessageConstant.EMAIL.INVALID_FORMAT })
  email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Vietnam phone number (^0[0-9]{9}$ or ^\\+84[0-9]{9}$)',
  })
  @IsRequired(AuthValidationMessageConstant.PHONE.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: AuthValidationMessageConstant.PHONE.MUST_BE_STRING })
  @IsNotEmpty({ message: AuthValidationMessageConstant.PHONE.NOT_EMPTY })
  @Matches(/^(0[0-9]{9}|\+84[0-9]{9})$/, {
    message: AuthValidationMessageConstant.PHONE.INVALID_FORMAT,
  })
  phone: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must be at least 8 characters, with uppercase, lowercase and number',
    minLength: 8,
  })
  @IsRequired(AuthValidationMessageConstant.PASSWORD.REQUIRED)
  @IsString({ message: AuthValidationMessageConstant.PASSWORD.MUST_BE_STRING })
  @IsNotEmpty({ message: AuthValidationMessageConstant.PASSWORD.NOT_EMPTY })
  @Length(8, 255, {
    message: AuthValidationMessageConstant.PASSWORD.INVALID_LENGTH,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: AuthValidationMessageConstant.PASSWORD.INVALID_FORMAT,
  })
  password: string;

  @ApiProperty({
    example: 'Lê Văn An',
    description: 'User full name',
    minLength: 1,
    maxLength: 254,
  })
  @IsRequired(AuthValidationMessageConstant.NAME.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: AuthValidationMessageConstant.NAME.MUST_BE_STRING })
  @IsNotEmpty({ message: AuthValidationMessageConstant.NAME.NOT_EMPTY })
  @Matches(/\S/, { message: AuthValidationMessageConstant.NAME.NOT_EMPTY })
  @Length(1, 254, {
    message: AuthValidationMessageConstant.NAME.INVALID_LENGTH,
  })
  name: string;

  @ApiProperty({
    example: 'tenant',
    enum: UserRole,
    description: 'User role, admin registration is strictly forbidden',
  })
  @IsRequired(AuthValidationMessageConstant.ROLE.REQUIRED)
  @IsEnum(UserRole, { message: AuthValidationMessageConstant.ROLE.INVALID })
  role: UserRole;

  toCommand(): RegisterCommand {
    return RegisterCommand.create(this);
  }

  static toCommand(request: RegisterRequestDto): RegisterCommand {
    return RegisterCommand.create(request);
  }
}
