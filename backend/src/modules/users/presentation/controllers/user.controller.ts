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
import { JwtAuthGuard } from 'modules/auth/infra/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/infra/guards/roles.guard';
import { CurrentUser } from 'shared/decorators/current-user.decorator';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { Roles } from 'shared/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ChangePasswordCommand } from '../../use-case/commands/implements/change-password.command';
import { UpdateMeCommand } from '../../use-case/commands/implements/update-me.command';
import { GetMeQuery } from '../../use-case/queries/implements/get-me.query';
import { CurrentUserProfileResult } from '../../use-case/results/current-user-profile.result';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { ChangePasswordRequestDto } from '../request/change-password.request.dto';
import { UpdateMeRequestDto } from '../request/update-me.request.dto';
import { UserProfileResponseDto } from '../response/user-profile.response.dto';

const SELF_SERVICE_ROLES = [
  UserRole.LANDLORD,
  UserRole.TENANT,
  UserRole.ADMIN,
] as const;

@ApiTags('Users')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SELF_SERVICE_ROLES)
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_PROFILE_FETCHED)
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile fetched successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, expired, or invalid token',
  })
  @ApiResponse({ status: 403, description: 'Role is not allowed' })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    const result: CurrentUserProfileResult = await this.queryBus.execute(
      GetMeQuery.create(user.id),
    );

    return UserProfileResponseDto.create(result.user, result.payoutAccount);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_PROFILE_UPDATED)
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: UpdateMeRequestDto,
  ): Promise<UserProfileResponseDto> {
    const result: CurrentUserProfileResult = await this.commandBus.execute(
      UpdateMeCommand.create(user.id, request),
    );

    return UserProfileResponseDto.create(result.user, result.payoutAccount);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.PASSWORD_CHANGED)
  @ApiOperation({ summary: 'Change the current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is invalid' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      ChangePasswordCommand.create(user.id, request),
    );
  }
}
