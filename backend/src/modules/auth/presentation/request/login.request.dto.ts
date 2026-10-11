import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoginCommand } from '../../use-case/commands/implements/login.command';

export class LoginRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    description: 'Email or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Remember session for longer expiry (7 days)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;

  toCommand(): LoginCommand {
    return LoginCommand.create(this);
  }

  static toCommand(request: LoginRequestDto): LoginCommand {
    return LoginCommand.create(request);
  }
}
