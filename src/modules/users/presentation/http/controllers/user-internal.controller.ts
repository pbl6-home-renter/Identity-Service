import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
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

@ApiExcludeController()
@InternalOnly()
@Controller('internal/users')
export class UserInternalController {
  constructor(private readonly queryBus: QueryBus) {}

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
