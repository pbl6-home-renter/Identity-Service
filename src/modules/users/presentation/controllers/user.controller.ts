import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'shared/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { CurrentUser } from 'shared/decorators/current-user.decorator';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { Roles } from 'shared/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ChangePasswordCommand } from '../../use-case/commands/implements/change-password.command';
import { UpdateMeCommand } from '../../use-case/commands/implements/update-me.command';
import { GetMeQuery } from '../../use-case/queries/implements/get-me.query';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { ChangePasswordRequestDto } from '../request/change-password.request.dto';
import { UpdateMeRequestDto } from '../request/update-me.request.dto';
import { UserProfileResponseDto } from '../response/user-profile.response.dto';
import { CurrentUserUpdateResponseDto } from '../response/current-user-update.response.dto';
@ApiTags('User')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.TENANT, UserRole.ADMIN)
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_CURRENT_FETCHED)
  @ApiOperation({ operationId: 'getCurrentUser', summary: 'Get current user' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_CURRENT_FETCHED,
    dataDto: UserProfileResponseDto,
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return UserProfileResponseDto.fromResult(
      await this.queryBus.execute(GetMeQuery.create(user.id)),
    );
  }

  @Patch('me')
  @ApiResponse({ status: 409, description: 'DUPLICATE_PHONE' })
  @ApiResponse({ status: 422, description: 'VALIDATION_FAILED' })
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_CURRENT_UPDATED)
  @ApiOperation({
    operationId: 'updateCurrentUser',
    summary: 'Update current user',
  })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_CURRENT_UPDATED,
    dataDto: CurrentUserUpdateResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: UpdateMeRequestDto,
  ): Promise<CurrentUserUpdateResponseDto> {
    return CurrentUserUpdateResponseDto.fromResult(
      await this.commandBus.execute(UpdateMeCommand.create(user.id, request)),
    );
  }

  @Put('me/password')
  @ApiResponse({
    status: 401,
    description: 'UNAUTHORIZED or INVALID_CREDENTIALS',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid password fields, PASSWORD_MISMATCH, or WEAK_PASSWORD',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'changeCurrentUserPassword',
    summary: 'Change password',
  })
  @ApiResponse({
    status: 204,
    description: 'Password changed; all refresh tokens revoked',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      ChangePasswordCommand.create(user.id, request),
    );
  }
}
