import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { UserListAdminQueryRequestDto } from '../request/user-list-admin.query.request.dto';
import { UserUpdateAdminRequestDto } from '../request/user-update-admin.request.dto';
import { UserLockRequestDto } from '../request/user-lock.request.dto';
import { UserListAdminResponseDto } from '../response/user-list-admin.response.dto';
import { UserGetDetailAdminResponseDto } from '../response/user-get-detail-admin.response.dto';
import { UserUpdateAdminResponseDto } from '../response/user-update-admin.response.dto';
import { UserLockResponseDto } from '../response/user-lock.response.dto';
import { UserUnlockResponseDto } from '../response/user-unlock.response.dto';
import { UserListAdminQuery } from '../../use-case/queries/implements/user-list-admin.query';
import { UserGetDetailAdminQuery } from '../../use-case/queries/implements/user-get-detail-admin.query';
import { UserUpdateAdminCommand } from '../../use-case/commands/implements/user-update-admin.command';
import { UserLockCommand } from '../../use-case/commands/implements/user-lock.command';
import { UserUnlockCommand } from '../../use-case/commands/implements/user-unlock.command';
import { UserDeleteCommand } from '../../use-case/commands/implements/user-delete.command';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserAdminController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_LIST_FETCHED)
  @ApiOperation({
    operationId: 'getUsersAdmin',
    summary: 'List and search users',
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 422, description: 'VALIDATION_FAILED' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_LIST_FETCHED,
    dataDto: UserListAdminResponseDto,
  })
  async getUsers(
    @Query() query: UserListAdminQueryRequestDto,
  ): Promise<PaginatedResponseDto<UserListAdminResponseDto>> {
    return this.queryBus.execute(UserListAdminQuery.create(query));
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_DETAIL_FETCHED)
  @ApiOperation({
    operationId: 'getUserDetailAdmin',
    summary: 'Get user detail',
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_DETAIL_FETCHED,
    dataDto: UserGetDetailAdminResponseDto,
  })
  @ApiResponse({ status: 400, description: 'INVALID_UUID' })
  async getUserDetail(
    @Param('userId', ParseUUIDPipe) userId: Uuid,
  ): Promise<UserGetDetailAdminResponseDto> {
    return UserGetDetailAdminResponseDto.fromResult(
      await this.queryBus.execute(UserGetDetailAdminQuery.create(userId)),
    );
  }

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_UPDATED)
  @ApiOperation({
    operationId: 'updateUserAdmin',
    summary: 'Update user account information',
  })
  @ApiResponse({ status: 400, description: 'INVALID_UUID' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({
    status: 409,
    description: 'DUPLICATE_PHONE',
  })
  @ApiResponse({
    status: 422,
    description: 'USER_UPDATE_PAYLOAD_REQUIRED or VALIDATION_FAILED',
  })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_UPDATED,
    dataDto: UserUpdateAdminResponseDto,
  })
  async updateUser(
    @Param('userId', ParseUUIDPipe) userId: Uuid,
    @Body() body: UserUpdateAdminRequestDto,
  ): Promise<UserUpdateAdminResponseDto> {
    return UserUpdateAdminResponseDto.fromDomain(
      await this.commandBus.execute(
        UserUpdateAdminCommand.create(userId, body),
      ),
    );
  }

  @Post(':userId/lock')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_ACCOUNT_LOCKED)
  @ApiOperation({
    operationId: 'lockUser',
    summary: 'Lock user account',
  })
  @ApiResponse({
    status: 400,
    description: 'USER_LOCK_CANNOT_SELF or INVALID_UUID',
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'USER_LOCK_ALREADY_LOCKED' })
  @ApiResponse({ status: 422, description: 'LOCK_REASON_REQUIRED' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_ACCOUNT_LOCKED,
    dataDto: UserLockResponseDto,
  })
  async lockUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: Uuid,
    @Body() body: UserLockRequestDto,
  ): Promise<UserLockResponseDto> {
    return UserLockResponseDto.fromDomain(
      await this.commandBus.execute(
        UserLockCommand.create(admin.id, userId, body),
      ),
    );
  }

  @Post(':userId/unlock')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_ACCOUNT_UNLOCKED)
  @ApiOperation({
    operationId: 'unlockUser',
    summary: 'Unlock user account',
  })
  @ApiResponse({ status: 400, description: 'INVALID_UUID' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'USER_UNLOCK_NOT_LOCKED' })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_ACCOUNT_UNLOCKED,
    dataDto: UserUnlockResponseDto,
  })
  async unlockUser(
    @Param('userId', ParseUUIDPipe) userId: Uuid,
  ): Promise<UserUnlockResponseDto> {
    return UserUnlockResponseDto.fromDomain(
      await this.commandBus.execute(UserUnlockCommand.create(userId)),
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteUser',
    summary: 'Soft delete user account',
  })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({
    status: 400,
    description: 'USER_DELETE_CANNOT_SELF or INVALID_UUID',
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'USER_DELETE_ALREADY_DELETED' })
  async deleteUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: Uuid,
  ): Promise<void> {
    await this.commandBus.execute(UserDeleteCommand.create(admin.id, userId));
  }
}
