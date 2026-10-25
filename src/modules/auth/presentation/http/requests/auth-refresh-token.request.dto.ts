import { AuthRefreshInput } from '../../../application/commands/auth-refresh/auth-refresh.command';
import { AuthLogoutInput } from '../../../application/commands/auth-logout/auth-logout.command';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { AuthValidationMessageConstant } from '../constants/auth-validation-message.constant';

/** Body of `POST /auth/refresh` and `POST /auth/logout`. */
export class AuthRefreshTokenRequestDto
  implements AuthLogoutInput, AuthRefreshInput
{
  @ApiProperty({
    example: 'm7Qp2vN8rT4xK9sL3wY6cB1hF5jD0uE_gAqZkRoUiVs',
    minLength: 1,
    writeOnly: true,
    description: 'Refresh token of the current session',
  })
  @IsRequired(AuthValidationMessageConstant.REFRESH_TOKEN.REQUIRED)
  @IsString({
    message: AuthValidationMessageConstant.REFRESH_TOKEN.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: AuthValidationMessageConstant.REFRESH_TOKEN.NOT_EMPTY,
  })
  @Matches(/\S/, {
    message: AuthValidationMessageConstant.REFRESH_TOKEN.NOT_EMPTY,
  })
  refreshToken: string;
}
