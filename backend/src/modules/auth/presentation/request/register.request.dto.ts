import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { RegisterCommand } from '../../use-case/commands/implements/register.command';

export class RegisterRequestDto {
  @ApiProperty({
    example: 'Lê Văn An',
    description: 'User full name',
    minLength: 1,
    maxLength: 254,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 254)
  name: string;

  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email address according to RFC 5322',
  })
  @IsEmail()
  @IsNotEmpty()
  @Length(5, 254)
  email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Vietnam phone number (^0[0-9]{9}$ or ^\\+84[0-9]{9}$)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[0-9]{9}|\+84[0-9]{9})$/, {
    message:
      'phone must be a valid Vietnam phone number (0xxxxxxxxx or +84xxxxxxxxx)',
  })
  phone: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must be at least 8 characters, with uppercase, lowercase and number',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain at least 8 characters, including uppercase, lowercase letters and numbers',
  })
  password: string;

  @ApiProperty({
    example: 'tenant',
    enum: [UserRole.TENANT, UserRole.LANDLORD],
    description: 'User role, admin registration is strictly forbidden',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([UserRole.TENANT, UserRole.LANDLORD], {
    message: 'role must be either tenant or landlord',
  })
  role: UserRole;

  toCommand(): RegisterCommand {
    return RegisterCommand.create(this);
  }

  static toCommand(request: RegisterRequestDto): RegisterCommand {
    return RegisterCommand.create(request);
  }
}
