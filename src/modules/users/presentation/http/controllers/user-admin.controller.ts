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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'shared/application/auth/authenticated-user';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { Roles } from 'shared/presentation/decorators/auth/access-control.decorators';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { UserListAdminQueryRequestDto } from '../requests/user-list-admin.query.request.dto';
import { UserUpdateAdminRequestDto } from '../requests/user-update-admin.request.dto';
import { UserLockRequestDto } from '../requests/user-lock.request.dto';
import { UserListAdminResponseDto } from '../responses/user-list-admin.response.dto';
import { UserGetDetailAdminResponseDto } from '../responses/user-get-detail-admin.response.dto';
import { UserUpdateAdminResponseDto } from '../responses/user-update-admin.response.dto';
import { UserLockResponseDto } from '../responses/user-lock.response.dto';
import { UserUnlockResponseDto } from '../responses/user-unlock.response.dto';
import { UserListAdminQuery } from '../../../application/queries/user-list-admin/user-list-admin.query';
import { UserGetDetailAdminQuery } from '../../../application/queries/user-get-detail-admin/user-get-detail-admin.query';
import { UserUpdateAdminCommand } from '../../../application/commands/user-update-admin/user-update-admin.command';
import { UserLockCommand } from '../../../application/commands/user-lock/user-lock.command';
import { UserUnlockCommand } from '../../../application/commands/user-unlock/user-unlock.command';
import { UserDeleteCommand } from '../../../application/commands/user-delete/user-delete.command';
import { User } from '../../../domain/entities/user';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
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
    const result: PaginatedResult<User> = await this.queryBus.execute(
      UserListAdminQuery.create(query),
    );
    return PaginatedResponseDto.create({
      data: result.data.map((user) =>
        UserListAdminResponseDto.fromDomain(user),
      ),
      pagination: result.pagination,
    });
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
