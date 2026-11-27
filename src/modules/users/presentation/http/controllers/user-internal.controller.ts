import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalOnly } from 'shared/presentation/decorators/auth/internal-only.decorator';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { UserResponseCodeConstant } from '../constants/user-response-code.constant';
import { UserLookupInternalQueryRequestDto } from '../requests/user-lookup-internal.query.request.dto';
import { UserLookupInternalResponseDto } from '../responses/user-lookup-internal.response.dto';
import { UserLookupInternalQuery } from '../../../application/queries/user-lookup-internal/user-lookup-internal.query';
import { MediaUserAvatarLookupQuery } from 'modules/media/application/queries/media-user-avatar-lookup/media-user-avatar-lookup.query';
import { UserAvatarUrlMap } from 'modules/media/application/queries/media-user-avatar-lookup/media-user-avatar-lookup.query.handler';
import { User } from '../../../domain/entities/user';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserLockPeriodGetInternalRequestDto } from '../requests/user-lock-period-get-internal.request.dto';
import { UserLockPeriodGetInternalResponseDto } from '../responses/user-lock-period-get-internal.response.dto';
import { UserLockPeriodGetInternalResult } from '../../../application/queries/user-lock-period-get-internal/user-lock-period-get-internal.result';
import { UserLockPeriodGetInternalQuery } from '../../../application/queries/user-lock-period-get-internal/user-lock-period-get-internal.query';
import { UserActiveAdminIdsInternalQuery } from '../../../application/queries/user-active-admin-ids-internal/user-active-admin-ids-internal.query';
import { UserActiveAdminIdsInternalResponseDto } from '../responses/user-active-admin-ids-internal.response.dto';

@ApiExcludeController()
@InternalOnly()
@Controller('internal/users')
export class UserInternalController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('admins/active-ids')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_ACTIVE_ADMIN_IDS_FETCHED)
  async activeAdminIds(): Promise<UserActiveAdminIdsInternalResponseDto> {
    const ids = await this.queryBus.execute<
      UserActiveAdminIdsInternalQuery,
      Uuid[]
    >(new UserActiveAdminIdsInternalQuery());
    return UserActiveAdminIdsInternalResponseDto.fromIds(ids);
  }

  @Get(':userId/lock-period')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_LOCK_PERIOD_FETCHED)
  async lockPeriod(
    @Param('userId', ParseUUIDPipe) userId: Uuid,
    @Query() request: UserLockPeriodGetInternalRequestDto,
  ): Promise<UserLockPeriodGetInternalResponseDto> {
    const result = await this.queryBus.execute<
      UserLockPeriodGetInternalQuery,
      UserLockPeriodGetInternalResult
    >(UserLockPeriodGetInternalRequestDto.toQuery(request, userId));
    return UserLockPeriodGetInternalResponseDto.fromResult(result);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(UserResponseCodeConstant.USER_LOOKUP_FETCHED)
  async lookupUsers(
    @Query() query: UserLookupInternalQueryRequestDto,
  ): Promise<UserLookupInternalResponseDto[]> {
    const users: User[] = await this.queryBus.execute(
      UserLookupInternalQuery.create(query.ids),
    );
    const avatars: UserAvatarUrlMap = await this.queryBus.execute(
      MediaUserAvatarLookupQuery.create(users.map((user) => user.id)),
    );
    return users.map((user) =>
      UserLookupInternalResponseDto.fromDomain(
        user,
        avatars.get(user.id) ?? null,
      ),
    );
  }
}
