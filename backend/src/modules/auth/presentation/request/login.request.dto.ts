import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { LoginCommand } from '../../use-case/commands/implements/login.command';
import { AUTH_VALIDATION_MESSAGES } from '../constants/auth-validation-message.constant';

export class LoginRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email or phone number',
  })
  @IsRequired(AUTH_VALIDATION_MESSAGES.IDENTIFIER.REQUIRED)
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
  })
  @IsString({ message: AUTH_VALIDATION_MESSAGES.IDENTIFIER.MUST_BE_STRING })
  @IsNotEmpty({ message: AUTH_VALIDATION_MESSAGES.IDENTIFIER.NOT_EMPTY })
  @Matches(/\S/, { message: AUTH_VALIDATION_MESSAGES.IDENTIFIER.NOT_EMPTY })
  identifier: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsRequired(AUTH_VALIDATION_MESSAGES.PASSWORD.REQUIRED)
  @IsString({ message: AUTH_VALIDATION_MESSAGES.PASSWORD.MUST_BE_STRING })
  @IsNotEmpty({ message: AUTH_VALIDATION_MESSAGES.PASSWORD.NOT_EMPTY })
  password: string;

  @ApiProperty({
    example: true,
    description: 'Remember session for longer expiry (7 days)',
  })
  @IsRequired(AUTH_VALIDATION_MESSAGES.REMEMBER_ME.REQUIRED)
  @IsBoolean({ message: AUTH_VALIDATION_MESSAGES.REMEMBER_ME.MUST_BE_BOOLEAN })
  rememberMe: boolean;

  toCommand(): LoginCommand {
    return LoginCommand.create(this);
  }

  static toCommand(request: LoginRequestDto): LoginCommand {
    return LoginCommand.create(request);
  }
}
