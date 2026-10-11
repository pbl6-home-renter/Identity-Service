import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { RegisterRequest } from '../request/register.request';
import { LoginRequest } from '../request/login.request';
import { AuthResponseDto } from '../response/auth.response.dto';
import { RegisterCommand } from '../../use-case/commands/register.command';
import { LoginCommand } from '../../use-case/commands/login.command';
import { AuthResultVo } from '../../domain/value-objects/auth-result.vo';
import { AuthCookieHelper } from '../helpers/auth-cookie.helper';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode('USER_REGISTERED')
  @ApiOperation({ summary: 'Register a new tenant or landlord account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  @ApiResponse({
    status: 422,
    description: 'Validation failed or role not allowed',
  })
  async register(
    @Body() request: RegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result: AuthResultVo = await this.commandBus.execute(
      new RegisterCommand(
        request.name,
        request.email,
        request.phone,
        request.password,
        request.role,
      ),
    );

    response.setHeader('Location', '/api/v1/me');
    AuthCookieHelper.setRefreshToken(response, result.refreshToken, true);

    return AuthResponseDto.create(result.accessToken, result.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseCode('LOGIN_SUCCESS')
  @ApiOperation({ summary: 'Log in with email or phone number' })
  @ApiResponse({
    status: 200,
    description: 'Logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(
    @Body() request: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const rememberMe = request.rememberMe ?? true;
    const result: AuthResultVo = await this.commandBus.execute(
      new LoginCommand(request.identifier, request.password, rememberMe),
    );

    AuthCookieHelper.setRefreshToken(response, result.refreshToken, rememberMe);

    return AuthResponseDto.create(result.accessToken, result.user);
  }
}
