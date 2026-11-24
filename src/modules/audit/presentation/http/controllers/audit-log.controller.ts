import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Roles } from 'shared/presentation/decorators/auth/access-control.decorators';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { PaginatedResponseDto } from 'shared/presentation/pagination/paginated.response.dto';
import { OffsetPaginationDto } from 'shared/presentation/pagination/offset-pagination.dto';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { AuditLogDetail } from '../../../application/queries/models/audit-log-detail.model';
import { AuditLogListItem } from '../../../application/queries/models/audit-log-list-item.model';
import { AuditLogListQuery } from '../../../application/queries/audit-log-list/audit-log-list.query';
import { AuditLogDetailQuery } from '../../../application/queries/audit-log-detail/audit-log-detail.query';
import { AuditLogListQueryRequestDto } from '../requests/audit-log-list.query.request.dto';
import { AuditLogListResponseDto } from '../responses/audit-log-list.response.dto';
import { AuditLogDetailResponseDto } from '../responses/audit-log-detail.response.dto';
import { AuditLogResponseCodeConstant } from '../constants/audit-log-response-code.constant';

@ApiTags('AuditLog')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
@ApiResponse({ status: 403, description: 'FORBIDDEN' })
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ResponseCode(AuditLogResponseCodeConstant.AUDIT_LOGS_FETCHED)
  @ApiOperation({ operationId: 'getAuditLogs', summary: 'Search audit logs' })
  @ApiResponse({
    status: 422,
    description: 'VALIDATION_FAILED or UNEXPECTED_FIELD',
  })
  @ApiExtraModels(AuditLogListResponseDto, OffsetPaginationDto)
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['statusCode', 'code', 'data', 'pagination'],
      properties: {
        statusCode: { type: 'integer', enum: [200] },
        code: {
          type: 'string',
          enum: [AuditLogResponseCodeConstant.AUDIT_LOGS_FETCHED],
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AuditLogListResponseDto) },
        },
        pagination: { $ref: getSchemaPath(OffsetPaginationDto) },
      },
    },
  })
  async list(
    @Query() input: AuditLogListQueryRequestDto,
  ): Promise<PaginatedResponseDto<AuditLogListResponseDto>> {
    const result: PaginatedResult<AuditLogListItem> =
      await this.queryBus.execute(AuditLogListQuery.create(input));
    return PaginatedResponseDto.create({
      data: result.data.map(AuditLogListResponseDto.fromResult),
      pagination: result.pagination,
    });
  }

  @Get(':auditLogId')
  @ApiParam({ name: 'auditLogId', type: String, format: 'uuid' })
  @ResponseCode(AuditLogResponseCodeConstant.AUDIT_LOG_FETCHED)
  @ApiOperation({
    operationId: 'getAuditLogsAuditlogid',
    summary: 'Get audit log details',
  })
  @ApiResponse({ status: 400, description: 'BAD_REQUEST (invalid UUID path)' })
  @ApiResponse({ status: 404, description: 'AUDIT_LOG_NOT_FOUND' })
  @ApiSuccessResponse({
    status: 200,
    code: AuditLogResponseCodeConstant.AUDIT_LOG_FETCHED,
    dataDto: AuditLogDetailResponseDto,
  })
  async detail(
    @Param('auditLogId', ParseUUIDPipe) auditLogId: Uuid,
  ): Promise<AuditLogDetailResponseDto> {
    const result: AuditLogDetail = await this.queryBus.execute(
      AuditLogDetailQuery.create(auditLogId),
    );
    return AuditLogDetailResponseDto.fromResult(result);
  }
}
