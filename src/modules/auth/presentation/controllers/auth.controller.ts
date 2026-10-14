import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { RegisterRequestDto } from '../request/register.request.dto';
import { LoginRequestDto } from '../request/login.request.dto';
import { AuthResponseDto } from '../response/auth.response.dto';
import { AuthResponseCodeConstant } from '../constants/auth-response-code.constant';
import { RegisterCommand } from '../../use-case/commands/implements/register.command';
import { LoginCommand } from '../../use-case/commands/implements/login.command';
import { RequestPasswordResetRequestDto } from '../request/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from '../response/request-password-reset.response.dto';
import { RequestPasswordResetCommand } from '../../use-case/commands/implements/request-password-reset.command';
import { ResetPasswordRequestDto } from '../request/reset-password.request.dto';
import { ResetPasswordCommand } from '../../use-case/commands/implements/reset-password.command';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
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
    description: 'Validation failed or role not allowed',
  })
  async register(
    @Body() request: RegisterRequestDto,
  ): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(RegisterCommand.create(request)),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.SESSION_STARTED)
  @ApiOperation({ summary: 'Log in with email or phone number' })
  @ApiSuccessResponse({
    status: 200,
    code: AuthResponseCodeConstant.SESSION_STARTED,
    dataDto: AuthResponseDto,
    description: 'Logged in successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(LoginCommand.create(request)),
    );
  }

  @Post('password-reset-requests')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.PASSWORD_RESET_REQUESTED)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiSuccessResponse({
    status: 200,
    code: AuthResponseCodeConstant.PASSWORD_RESET_REQUESTED,
    dataDto: RequestPasswordResetResponseDto,
    description: 'The password reset request was accepted',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async requestPasswordReset(
    @Body() request: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    await this.commandBus.execute(RequestPasswordResetCommand.create(request));
    return RequestPasswordResetResponseDto.create();
  }

  @Post('password-resets')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using a single-use token' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired password reset token',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', enum: [400] },
            code: { type: 'string', enum: ['INVALID_RESET_TOKEN'] },
          },
        },
        {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', enum: [400] },
            code: { type: 'string', enum: ['RESET_TOKEN_EXPIRED'] },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async resetPassword(@Body() request: ResetPasswordRequestDto): Promise<void> {
    await this.commandBus.execute(ResetPasswordCommand.create(request));
  }
}
