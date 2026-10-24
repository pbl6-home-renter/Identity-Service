import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'shared/interfaces/authenticated-user.interface';
import {
  AllowLocked,
  CurrentUser,
  Roles,
} from 'shared/decorators/auth.decorators';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserChangePasswordCommand } from '../../use-case/commands/implements/user-change-password.command';
import { UserUpdateMeCommand } from '../../use-case/commands/implements/user-update-me.command';
import { UserGetMeQuery } from '../../use-case/queries/implements/user-get-me.query';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { UserChangePasswordRequestDto } from '../request/user-change-password.request.dto';
import { UserUpdateMeRequestDto } from '../request/user-update-me.request.dto';
import { UserGetMeResponseDto } from '../response/user-get-me.response.dto';
import { UserUpdateMeResponseDto } from '../response/user-update-me.response.dto';
@ApiTags('User')
@ApiBearerAuth()
@Controller()
@Roles(UserRole.LANDLORD, UserRole.TENANT, UserRole.ADMIN)
@AllowLocked()
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.CURRENT_USER_PROFILE_FETCHED)
  @ApiOperation({ operationId: 'getCurrentUser', summary: 'Get current user' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.CURRENT_USER_PROFILE_FETCHED,
    dataDto: UserGetMeResponseDto,
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserGetMeResponseDto> {
    return UserGetMeResponseDto.fromResult(
      await this.queryBus.execute(UserGetMeQuery.create(user.id)),
    );
  }

  @Patch('me')
  @ApiResponse({ status: 409, description: 'DUPLICATE_PHONE' })
  @ApiResponse({
    status: 422,
    description: 'USER_UPDATE_PAYOUT_NOT_ALLOWED or VALIDATION_FAILED',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.CURRENT_USER_PROFILE_UPDATED)
  @ApiOperation({
    operationId: 'updateCurrentUser',
    summary: 'Update current user',
  })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.CURRENT_USER_PROFILE_UPDATED,
    dataDto: UserUpdateMeResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: UserUpdateMeRequestDto,
  ): Promise<UserUpdateMeResponseDto> {
    return UserUpdateMeResponseDto.fromResult(
      await this.commandBus.execute(
        UserUpdateMeCommand.create(user.id, request),
      ),
    );
  }

  @Put('me/password')
  @ApiResponse({
    status: 401,
    description: 'UNAUTHORIZED or USER_CHANGE_PASSWORD_INVALID_CURRENT',
  })
  @ApiResponse({
    status: 422,
    description:
      'Invalid password fields, USER_CHANGE_PASSWORD_MISMATCH, or WEAK_PASSWORD',
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
    @Body() request: UserChangePasswordRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      UserChangePasswordCommand.create(user.id, request),
    );
  }
}
