import { ApiProperty } from '@nestjs/swagger';
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

export class RegisterRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email address according to RFC 5322',
  })
  @IsRequired('EMAIL_REQUIRED')
  @IsString({ message: 'INVALID_EMAIL' })
  @Length(5, 254, { message: 'INVALID_EMAIL' })
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Vietnam phone number (^0[0-9]{9}$ or ^\\+84[0-9]{9}$)',
  })
  @IsRequired('PHONE_REQUIRED')
  @IsString({ message: 'INVALID_PHONE' })
  @Matches(/^(0[0-9]{9}|\+84[0-9]{9})$/, {
    message: 'INVALID_PHONE',
  })
  phone: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must be at least 8 characters, with uppercase, lowercase and number',
    minLength: 8,
  })
  @IsRequired('PASSWORD_REQUIRED')
  @IsString({ message: 'INVALID_PASSWORD' })
  @IsNotEmpty({ message: 'INVALID_PASSWORD' })
  @Length(8, 255, { message: 'INVALID_PASSWORD' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'INVALID_PASSWORD',
  })
  password: string;

  @ApiProperty({
    example: 'Lê Văn An',
    description: 'User full name',
    minLength: 1,
    maxLength: 254,
  })
  @IsRequired('NAME_REQUIRED')
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/\S/, { message: 'INVALID_NAME' })
  @Length(1, 254, { message: 'INVALID_NAME' })
  name: string;

  @ApiProperty({
    example: 'tenant',
    enum: UserRole,
    description: 'User role, admin registration is strictly forbidden',
  })
  @IsRequired('ROLE_REQUIRED')
  @IsEnum(UserRole, { message: 'INVALID_ROLE' })
  role: UserRole;

  toCommand(): RegisterCommand {
    return RegisterCommand.create(this);
  }

  static toCommand(request: RegisterRequestDto): RegisterCommand {
    return RegisterCommand.create(request);
  }
}
