import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import {
  AllowLocked,
  Public,
} from 'shared/presentation/decorators/auth/access-control.decorators';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from 'shared/application/auth/authenticated-user';
import { AuthRefreshTokenRequestDto } from '../requests/auth-refresh-token.request.dto';
import { AuthRefreshResponseDto } from '../responses/auth-refresh.response.dto';
import { AuthRefreshCommand } from '../../../application/commands/auth-refresh/auth-refresh.command';
import { AuthLogoutCommand } from '../../../application/commands/auth-logout/auth-logout.command';
import { AuthRegisterCommand } from '../../../application/commands/auth-register/auth-register.command';
import { EmailVerificationConfirmCommand } from '../../../application/commands/email-verification-confirm/email-verification-confirm.command';
import { EmailVerificationRequestCommand } from '../../../application/commands/email-verification-request/email-verification-request.command';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { AuthRegisterRequestDto } from '../requests/auth-register.request.dto';
import { AuthLoginRequestDto } from '../requests/auth-login.request.dto';
import { AuthResponseDto } from '../responses/auth.response.dto';
import { AuthResponseCodeConstant } from '../constants/auth-response-code.constant';
import { AuthLoginCommand } from '../../../application/commands/auth-login/auth-login.command';
import { User } from 'modules/users/domain/entities/user';
import { RequestPasswordResetRequestDto } from '../requests/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from '../responses/request-password-reset.response.dto';
import { PasswordResetRequestCommand } from '../../../application/commands/password-reset-request/password-reset-request.command';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { ResetPasswordRequestDto } from '../requests/reset-password.request.dto';
import { PasswordResetConfirmCommand } from '../../../application/commands/password-reset-confirm/password-reset-confirm.command';
import { AuthRegisterPendingResponseDto } from '../responses/auth-register-pending.response.dto';
import { EmailVerificationConfirmRequestDto } from '../requests/email-verification-confirm.request.dto';
import { RequestEmailVerificationRequestDto } from '../requests/request-email-verification.request.dto';
import { RequestEmailVerificationResponseDto } from '../responses/request-email-verification.response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode(AuthResponseCodeConstant.USER_REGISTERED)
  @ApiOperation({
    operationId: 'registerAccount',
    summary: 'Register a new tenant or landlord account',
  })
  @ApiSuccessResponse({
    status: 201,
    code: AuthResponseCodeConstant.USER_REGISTERED,
    dataDto: AuthRegisterPendingResponseDto,
    description: 'Account created; verify the email address before logging in',
  })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  @ApiResponse({
    status: 422,
    description: 'AUTH_REGISTER_ROLE_NOT_ALLOWED or VALIDATION_FAILED',
  })
  async register(
    @Body() request: AuthRegisterRequestDto,
  ): Promise<AuthRegisterPendingResponseDto> {
    return AuthRegisterPendingResponseDto.fromUser(
      await this.commandBus.execute<AuthRegisterCommand, User>(
        AuthRegisterRequestDto.toCommand(request),
      ),
    );
  }

  @Post('email-verifications')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'verifyRegisteredEmail',
    summary: 'Verify email and activate a registered account',
  })
  @ApiResponse({
    status: 204,
    description: 'Email verified and account activated',
  })
  @ApiResponse({ status: 400, description: 'Invalid or already used token' })
  @ApiResponse({ status: 409, description: 'Email verification token expired' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Unexpected server error' })
  async verifyEmail(
    @Body() request: EmailVerificationConfirmRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<EmailVerificationConfirmCommand, void>(
      EmailVerificationConfirmRequestDto.toCommand(request),
    );
  }

  @Post('email-verification-requests')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseCode(AuthResponseCodeConstant.EMAIL_VERIFICATION_REQUESTED)
  @ApiOperation({
    operationId: 'requestEmailVerification',
    summary: 'Request another account verification email',
  })
  @ApiSuccessResponse({
    status: HttpStatus.ACCEPTED,
    code: AuthResponseCodeConstant.EMAIL_VERIFICATION_REQUESTED,
    dataDto: RequestEmailVerificationResponseDto,
    description: 'The request was accepted if verification is still required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Malformed request body',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description:
      'EMAIL_REQUIRED, INVALID_EMAIL, UNEXPECTED_FIELD or VALIDATION_FAILED',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Unexpected server error',
  })
  async requestEmailVerification(
    @Body() request: RequestEmailVerificationRequestDto,
  ): Promise<RequestEmailVerificationResponseDto> {
    await this.commandBus.execute<EmailVerificationRequestCommand, void>(
      RequestEmailVerificationRequestDto.toCommand(request),
    );
    return RequestEmailVerificationResponseDto.create(true);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.SESSION_STARTED)
  @ApiOperation({
    operationId: 'loginAccount',
    summary: 'Log in with email or phone number',
  })
  @ApiSuccessResponse({
    status: 200,
    code: AuthResponseCodeConstant.SESSION_STARTED,
    dataDto: AuthResponseDto,
    description: 'Logged in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'AUTH_LOGIN_INVALID_CREDENTIALS',
  })
  @ApiResponse({
    status: 403,
    description: 'EMAIL_NOT_VERIFIED or account locked',
  })
  async login(@Body() request: AuthLoginRequestDto): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(AuthLoginCommand.create(request)),
    );
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.SESSION_REFRESHED)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new access token',
  })
  @ApiSuccessResponse({
    status: 200,
    code: AuthResponseCodeConstant.SESSION_REFRESHED,
    dataDto: AuthRefreshResponseDto,
    description: 'Session refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'INVALID_REFRESH_TOKEN or TOKEN_REUSED',
  })
  async refresh(
    @Body() request: AuthRefreshTokenRequestDto,
  ): Promise<AuthRefreshResponseDto> {
    return AuthRefreshResponseDto.fromResult(
      await this.commandBus.execute(AuthRefreshCommand.create(request)),
    );
  }

  @Post('logout')
  @AllowLocked()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the refresh token family of this session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: AuthRefreshTokenRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(AuthLogoutCommand.create(user.id, request));
  }

  @Post('password-reset-requests')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseCode(AuthResponseCodeConstant.PASSWORD_RESET_REQUESTED)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiSuccessResponse({
    status: HttpStatus.ACCEPTED,
    code: AuthResponseCodeConstant.PASSWORD_RESET_REQUESTED,
    dataDto: RequestPasswordResetResponseDto,
    description: 'The password reset request was accepted for processing',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async requestPasswordReset(
    @Body() request: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    try {
      await this.commandBus.execute(
        PasswordResetRequestCommand.create(request),
      );
      return RequestPasswordResetResponseDto.create(true);
    } catch (error) {
      // Same 202 whether or not the email exists, so accounts cannot be probed.
      if (error instanceof UserNotFoundException) {
        return RequestPasswordResetResponseDto.create(true);
      }
      throw error;
    }
  }

  @Post('password-resets')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using a single-use token' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Malformed request body',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Password reset token has been used or has expired',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['statusCode', 'code'],
      properties: {
        statusCode: { type: 'integer', enum: [409] },
        code: { type: 'string', enum: ['TOKEN_USED', 'TOKEN_EXPIRED'] },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['statusCode', 'code'],
      properties: {
        statusCode: { type: 'integer', enum: [422] },
        code: {
          type: 'string',
          enum: [
            'TOKEN_REQUIRED',
            'INVALID_TOKEN',
            'NEW_PASSWORD_REQUIRED',
            'INVALID_NEW_PASSWORD',
            'UNEXPECTED_FIELD',
            'VALIDATION_FAILED',
          ],
        },
      },
    },
  })
  async resetPassword(@Body() request: ResetPasswordRequestDto): Promise<void> {
    await this.commandBus.execute(PasswordResetConfirmCommand.create(request));
  }
}
