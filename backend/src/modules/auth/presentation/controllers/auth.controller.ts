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
import { RegisterRequestDto } from '../request/register.request.dto';
import { LoginRequestDto } from '../request/login.request.dto';
import { AuthResponseDto } from '../response/auth.response.dto';
import { RegisterCommand } from '../../use-case/commands/implements/register.command';
import { LoginCommand } from '../../use-case/commands/implements/login.command';
import { AuthResult } from '../../use-case/results/auth.result';

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
    @Body() request: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result: AuthResult = await this.commandBus.execute(
      RegisterCommand.create(request),
    );

    response.setHeader('Location', '/api/v1/me');

    return AuthResponseDto.create(
      result.accessToken,
      result.refreshToken,
      result.user,
    );
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
  async login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    const result: AuthResult = await this.commandBus.execute(
      LoginCommand.create(request),
    );

    return AuthResponseDto.create(
      result.accessToken,
      result.refreshToken,
      result.user,
    );
  }
}
