import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { LoginCommand } from '../../use-case/commands/implements/login.command';

export class LoginRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email or phone number',
  })
  @IsRequired('IDENTIFIER_REQUIRED')
  @IsString({ message: 'INVALID_IDENTIFIER' })
  @Matches(/\S/, { message: 'INVALID_IDENTIFIER' })
  identifier: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsRequired('PASSWORD_REQUIRED')
  @IsString({ message: 'INVALID_PASSWORD' })
  @IsNotEmpty({ message: 'INVALID_PASSWORD' })
  password: string;

  @ApiProperty({
    example: true,
    description: 'Remember session for longer expiry (7 days)',
  })
  @IsRequired('REMEMBER_ME_REQUIRED')
  @IsBoolean({ message: 'INVALID_REMEMBER_ME' })
  rememberMe: boolean;

  toCommand(): LoginCommand {
    return LoginCommand.create(this);
  }

  static toCommand(request: LoginRequestDto): LoginCommand {
    return LoginCommand.create(request);
  }
}
