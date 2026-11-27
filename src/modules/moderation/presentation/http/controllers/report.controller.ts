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
import { Roles } from 'shared/presentation/decorators/auth/access-control.decorators';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { ReportResolveCommand } from '../../../application/commands/report-resolve/report-resolve.command';
import { ReportResolveResult } from '../../../application/commands/report-resolve/report-resolve.command.handler';
import { ReportSubmitCommand } from '../../../application/commands/report-submit/report-submit.command';
import {
  ReportDetailModel,
  ReportListItemModel,
} from '../../../application/queries/models/report.model';
import { ReportGetDetailAdminQuery } from '../../../application/queries/report-get-detail-admin/report-get-detail-admin.query';
import { ReportListAdminQuery } from '../../../application/queries/report-list-admin/report-list-admin.query';
import { UserReport } from '../../../domain/entities/user-report';
import { ModerationResponseCodeConstant as Codes } from '../constants/moderation-response-code.constant';
import {
  ReportListAdminQueryRequestDto,
  ReportResolveRequestDto,
  ReportSubmitRequestDto,
} from '../requests/moderation.request.dto';
import {
  ReportAdminDetailResponseDto,
  ReportAdminListItemResponseDto,
  ReportResolveResponseDto,
  ReportResponseDto,
} from '../responses/moderation.response.dto';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(UserRole.LANDLORD, UserRole.TENANT)
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode(Codes.REPORT_SUBMITTED)
  @ApiOperation({
    operationId: 'submitUserReport',
    summary: 'Report another account for a violation',
  })
  @ApiSuccessResponse({
    status: 201,
    code: Codes.REPORT_SUBMITTED,
    dataDto: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'REPORT_ALREADY_PENDING' })
  @ApiResponse({
    status: 422,
    description:
      'REPORT_SELF, MODERATION_ATTACHMENT_INVALID or VALIDATION_FAILED',
  })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ReportSubmitRequestDto,
  ): Promise<ReportResponseDto> {
    const report: UserReport = await this.commandBus.execute(
      ReportSubmitCommand.create(user.id, body),
    );
    return ReportResponseDto.fromDomain(report);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.REPORT_LIST_FETCHED)
  @ApiOperation({ operationId: 'getUserReportsAdmin', summary: 'List reports' })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.REPORT_LIST_FETCHED,
    dataDto: ReportAdminListItemResponseDto,
  })
  async list(
    @Query() query: ReportListAdminQueryRequestDto,
  ): Promise<PaginatedResponseDto<ReportAdminListItemResponseDto>> {
    const result: PaginatedResult<ReportListItemModel> =
      await this.queryBus.execute(
        new ReportListAdminQuery({
          pageNo: query.pageNo,
          pageSize: query.pageSize,
          status: query.status,
          category: query.category,
          reportedUserId: query.reportedUserId,
        }),
      );
    return PaginatedResponseDto.create({
      data: result.data.map((item) =>
        ReportAdminListItemResponseDto.fromModel(item),
      ),
      pagination: result.pagination,
    });
  }

  @Get(':reportId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.REPORT_DETAIL_FETCHED)
  @ApiOperation({ operationId: 'getUserReportAdmin', summary: 'Get a report' })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.REPORT_DETAIL_FETCHED,
    dataDto: ReportAdminDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'REPORT_NOT_FOUND' })
  async detail(
    @Param('reportId', ParseUUIDPipe) reportId: Uuid,
  ): Promise<ReportAdminDetailResponseDto> {
    const model: ReportDetailModel = await this.queryBus.execute(
      new ReportGetDetailAdminQuery(reportId),
    );
    return ReportAdminDetailResponseDto.fromDetail(model);
  }

  @Post(':reportId/resolve')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseCode(Codes.REPORT_RESOLVED)
  @ApiOperation({
    operationId: 'resolveUserReport',
    summary: 'Dismiss a report, or lock the reported account',
  })
  @ApiSuccessResponse({
    status: 200,
    code: Codes.REPORT_RESOLVED,
    dataDto: ReportResolveResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'REPORT_NOT_FOUND or USER_NOT_FOUND',
  })
  @ApiResponse({
    status: 409,
    description: 'REPORT_NOT_PENDING or USER_LOCK_PENDING_VERIFICATION',
  })
  @ApiResponse({ status: 422, description: 'VALIDATION_FAILED' })
  async resolve(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('reportId', ParseUUIDPipe) reportId: Uuid,
    @Body() body: ReportResolveRequestDto,
  ): Promise<ReportResolveResponseDto> {
    const result: ReportResolveResult = await this.commandBus.execute(
      ReportResolveCommand.create(admin.id, reportId, body),
    );
    return ReportResolveResponseDto.fromDomain(result.report, result.locked);
  }
}
