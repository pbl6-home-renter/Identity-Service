import { ApiProperty } from '@nestjs/swagger';
import { AuthRefreshResult } from '../../use-case/results/auth-refresh.result';

export class AuthRefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token with 15-minute expiration',
  })
  accessToken: string;

  @ApiProperty({
    example: 'Xk3Lp9Qw2Er7Ty5Ui1Op8As4Df6Gh0Jk_zXcVbNmQwE',
    description:
      'New refresh token; the one sent in the request is now revoked',
  })
  refreshToken: string;

  static fromResult(result: AuthRefreshResult): AuthRefreshResponseDto {
    const dto = new AuthRefreshResponseDto();
    dto.accessToken = result.accessToken;
    dto.refreshToken = result.refreshToken;
    return dto;
  }
}
