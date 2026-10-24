import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import {
  AllowLocked,
  CurrentUser,
  Public,
} from 'shared/decorators/auth.decorators';
import { AuthenticatedUser } from 'shared/interfaces/authenticated-user.interface';
import { AuthRefreshTokenRequestDto } from '../request/auth-refresh-token.request.dto';
import { AuthRefreshResponseDto } from '../response/auth-refresh.response.dto';
import { AuthRefreshCommand } from '../../use-case/commands/implements/auth-refresh.command';
import { AuthLogoutCommand } from '../../use-case/commands/implements/auth-logout.command';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { AuthRegisterRequestDto } from '../request/auth-register.request.dto';
import { AuthLoginRequestDto } from '../request/auth-login.request.dto';
import { AuthResponseDto } from '../response/auth.response.dto';
import { AuthResponseCodeConstant } from '../constants/auth-response-code.constant';
import { AuthRegisterCommand } from '../../use-case/commands/implements/auth-register.command';
import { AuthLoginCommand } from '../../use-case/commands/implements/auth-login.command';
import { RequestPasswordResetRequestDto } from '../request/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from '../response/request-password-reset.response.dto';
import { RequestPasswordResetCommand } from '../../use-case/commands/implements/request-password-reset.command';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { AuthLoginAccountLockedException } from '../../domain/exceptions/auth-login-account-locked.exception';
import { ResetPasswordRequestDto } from '../request/reset-password.request.dto';
import { ResetPasswordCommand } from '../../use-case/commands/implements/reset-password.command';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Header('Location', '/api/v1/me')
  @ResponseCode(AuthResponseCodeConstant.USER_REGISTERED)
  @ApiOperation({ summary: 'Register a new tenant or landlord account' })
  @ApiSuccessResponse({
    status: 201,
    code: AuthResponseCodeConstant.USER_REGISTERED,
    dataDto: AuthResponseDto,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  @ApiResponse({
    status: 422,
    description: 'AUTH_REGISTER_ROLE_NOT_ALLOWED or VALIDATION_FAILED',
  })
  async register(
    @Body() request: AuthRegisterRequestDto,
  ): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(AuthRegisterCommand.create(request)),
    );
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.SESSION_STARTED)
  @ApiOperation({ summary: 'Log in with email or phone number' })
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
  @ApiResponse({ status: 403, description: 'Account locked' })
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
        RequestPasswordResetCommand.create(request),
      );
      return RequestPasswordResetResponseDto.create(true);
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof AuthLoginAccountLockedException
      ) {
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
    await this.commandBus.execute(ResetPasswordCommand.create(request));
  }
}
