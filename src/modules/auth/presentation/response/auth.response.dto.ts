import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/domain/entities/user';
import { AuthResult } from '../../use-case/results/auth.result';
import { AuthUserDto } from './auth-user.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token with 15-minute expiration',
  })
  accessToken: string;

  @ApiProperty({
    example: 'c2f71887-b9c1-4b10-86b3-e5e6e30b355a',
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  static create(
    accessToken: string,
    refreshToken: string,
    user: User,
  ): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.user = AuthUserDto.fromDomain(user);
    return dto;
  }

  static fromResult(result: AuthResult): AuthResponseDto {
    return AuthResponseDto.create(
      result.accessToken,
      result.refreshToken,
      result.user,
    );
  }
}
