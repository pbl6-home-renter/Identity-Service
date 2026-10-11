import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginRequest {
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
}
