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
import { RegisterRequestDto } from '../request/register.request.dto';
import { LoginRequestDto } from '../request/login.request.dto';
import { AuthResponseDto } from '../response/auth.response.dto';
import { AuthResponseCodeConstant } from '../constants/auth-response-code.constant';
import { RegisterCommand } from '../../use-case/commands/implements/register.command';
import { LoginCommand } from '../../use-case/commands/implements/login.command';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Header('Location', '/api/v1/me')
  @ResponseCode(AuthResponseCodeConstant.USER_REGISTERED)
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
  ): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(RegisterCommand.create(request)),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(AuthResponseCodeConstant.SESSION_STARTED)
  @ApiOperation({ summary: 'Log in with email or phone number' })
  @ApiResponse({
    status: 200,
    description: 'Logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    return AuthResponseDto.fromResult(
      await this.commandBus.execute(LoginCommand.create(request)),
    );
  }
}
