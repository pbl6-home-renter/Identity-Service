import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  AllowLocked,
  Roles,
} from 'shared/presentation/decorators/auth/access-control.decorators';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { AppealAcceptCommand } from '../../../application/commands/appeal-accept/appeal-accept.command';
import { AppealAcceptResult } from '../../../application/commands/appeal-accept/appeal-accept.command.handler';
import { AppealRejectCommand } from '../../../application/commands/appeal-reject/appeal-reject.command';
import { AppealSubmitCommand } from '../../../application/commands/appeal-submit/appeal-submit.command';
import { AppealGetCurrentQuery } from '../../../application/queries/appeal-get-current/appeal-get-current.query';
import { AppealCurrentResult } from '../../../application/queries/appeal-get-current/appeal-get-current.query.handler';
import { AppealGetDetailAdminQuery } from '../../../application/queries/appeal-get-detail-admin/appeal-get-detail-admin.query';
import { AppealListAdminQuery } from '../../../application/queries/appeal-list-admin/appeal-list-admin.query';
import {
  AppealDetailModel,
  AppealListItemModel,
} from '../../../application/queries/models/appeal.model';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { ModerationResponseCodeConstant as Codes } from '../constants/moderation-response-code.constant';
import {
  AppealListAdminQueryRequestDto,
  AppealRejectRequestDto,
  AppealSubmitRequestDto,
} from '../requests/moderation.request.dto';
import {
  AppealAdminDetailResponseDto,
  AppealAdminListItemResponseDto,
  AppealCurrentResponseDto,
  AppealResponseDto,
  AppealReviewResponseDto,
} from '../responses/moderation.response.dto';

/** The locked user's side of an appeal. Reached by locked accounts (P13-D109). */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('me/appeals')
@Roles(UserRole.LANDLORD, UserRole.TENANT)
@AllowLocked()
export class MeAppealController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.APPEAL_CURRENT_FETCHED)
  @ApiOperation({
    operationId: 'getMyCurrentAppeal',
    summary: 'Lock reason and latest appeal of the current lock period',
  })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.APPEAL_CURRENT_FETCHED,
    dataDto: AppealCurrentResponseDto,
  })
  async getCurrent(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AppealCurrentResponseDto> {
    const result: AppealCurrentResult = await this.queryBus.execute(
      new AppealGetCurrentQuery(user.id),
    );
    return AppealCurrentResponseDto.fromResult(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode(Codes.APPEAL_SUBMITTED)
  @ApiOperation({
    operationId: 'submitMyAppeal',
    summary: 'Submit an appeal against the account lock',
  })
  @ApiSuccessResponse({
    status: 201,
    code: Codes.APPEAL_SUBMITTED,
    dataDto: AppealResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'ACCOUNT_NOT_LOCKED, APPEAL_ALREADY_PENDING or APPEAL_COOLDOWN',
  })
  @ApiResponse({
    status: 422,
    description: 'VALIDATION_FAILED or MODERATION_ATTACHMENT_INVALID',
  })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AppealSubmitRequestDto,
  ): Promise<AppealResponseDto> {
    const appeal: AccountAppeal = await this.commandBus.execute(
      AppealSubmitCommand.create(user.id, body),
    );
    return AppealResponseDto.fromDomain(appeal);
  }
}

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('appeals')
@Roles(UserRole.ADMIN)
export class AppealAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.APPEAL_LIST_FETCHED)
  @ApiOperation({ operationId: 'getAppealsAdmin', summary: 'List appeals' })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.APPEAL_LIST_FETCHED,
    dataDto: AppealAdminListItemResponseDto,
  })
  async list(
    @Query() query: AppealListAdminQueryRequestDto,
  ): Promise<PaginatedResponseDto<AppealAdminListItemResponseDto>> {
    const result: PaginatedResult<AppealListItemModel> =
      await this.queryBus.execute(
        new AppealListAdminQuery({
          pageNo: query.pageNo,
          pageSize: query.pageSize,
          status: query.status,
          userId: query.userId,
        }),
      );
    return PaginatedResponseDto.create({
      data: result.data.map((item) =>
        AppealAdminListItemResponseDto.fromModel(item),
      ),
      pagination: result.pagination,
    });
  }

  @Get(':appealId')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.APPEAL_DETAIL_FETCHED)
  @ApiOperation({ operationId: 'getAppealAdmin', summary: 'Get an appeal' })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.APPEAL_DETAIL_FETCHED,
    dataDto: AppealAdminDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'APPEAL_NOT_FOUND' })
  async detail(
    @Param('appealId', ParseUUIDPipe) appealId: Uuid,
  ): Promise<AppealAdminDetailResponseDto> {
    const model: AppealDetailModel = await this.queryBus.execute(
      new AppealGetDetailAdminQuery(appealId),
    );
    return AppealAdminDetailResponseDto.fromDetail(model);
  }

  @Post(':appealId/accept')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.APPEAL_ACCEPTED)
  @ApiOperation({
    operationId: 'acceptAppeal',
    summary: 'Accept an appeal and unlock the account',
  })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.APPEAL_ACCEPTED,
    dataDto: AppealReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'APPEAL_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'APPEAL_NOT_PENDING' })
  async accept(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('appealId', ParseUUIDPipe) appealId: Uuid,
  ): Promise<AppealReviewResponseDto> {
    const result: AppealAcceptResult = await this.commandBus.execute(
      new AppealAcceptCommand(admin.id, appealId),
    );
    return AppealReviewResponseDto.fromDomain(result.appeal, result.unlocked);
  }

  @Post(':appealId/reject')
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.APPEAL_REJECTED)
  @ApiOperation({
    operationId: 'rejectAppeal',
    summary: 'Reject an appeal with a reason',
  })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.APPEAL_REJECTED,
    dataDto: AppealReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'APPEAL_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'APPEAL_NOT_PENDING' })
  async reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('appealId', ParseUUIDPipe) appealId: Uuid,
    @Body() body: AppealRejectRequestDto,
  ): Promise<AppealReviewResponseDto> {
    const appeal: AccountAppeal = await this.commandBus.execute(
      new AppealRejectCommand(admin.id, appealId, body.rejectReason),
    );
    return AppealReviewResponseDto.fromDomain(appeal, false);
  }
}
