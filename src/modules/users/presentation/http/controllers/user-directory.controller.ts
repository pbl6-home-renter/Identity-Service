import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'shared/application/auth/authenticated-user';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Roles } from 'shared/presentation/decorators/auth/access-control.decorators';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { UserDirectoryEntryModel } from '../../../application/queries/models/user-directory-entry.model';
import { UserDirectoryListQuery } from '../../../application/queries/user-directory-list/user-directory-list.query';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { UserDirectoryListQueryRequestDto } from '../requests/user-directory-list.query.request.dto';
import { UserDirectoryListResponseDto } from '../responses/user-directory-list.response.dto';

/**
 * Registered before UserAdminController so `users/directory` is not matched
 * by the admin-only `users/:userId` route.
 */
@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.LANDLORD, UserRole.TENANT)
export class UserDirectoryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('directory')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_DIRECTORY_FETCHED)
  @ApiOperation({
    operationId: 'getUsersDirectory',
    summary: 'Search active landlords/tenants by name',
  })
  @ApiSuccessResponse({
    status: 200,
    code: UserResponseCodeConstant.USER_DIRECTORY_FETCHED,
    dataDto: UserDirectoryListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN or ACCOUNT_LOCKED' })
  @ApiResponse({
    status: 422,
    description: 'VALIDATION_FAILED or UNEXPECTED_FIELD',
  })
  async search(
    @Query() query: UserDirectoryListQueryRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<UserDirectoryListResponseDto>> {
    const result: PaginatedResult<UserDirectoryEntryModel> =
      await this.queryBus.execute(
        UserDirectoryListQuery.create(user.id, query),
      );
    return PaginatedResponseDto.create({
      data: result.data.map((entry) =>
        UserDirectoryListResponseDto.fromModel(entry),
      ),
      pagination: result.pagination,
    });
  }
}
