import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IsUuid } from 'shared/presentation/validators/is-uuid.decorator';
import { AuditLogListInput } from '../../../application/queries/audit-log-list/audit-log-list.query';
import {
  AUDIT_LOG_ACTIONS,
  AuditLogAction,
} from '../../../application/queries/models/audit-log-action';
import {
  AUDIT_LOG_ENTITY_TYPES,
  AuditLogEntityType,
} from '../../../application/queries/models/audit-log-entity-type';

export class AuditLogListQueryRequestDto implements AuditLogListInput {
  @ApiPropertyOptional({ enum: AUDIT_LOG_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_LOG_ACTIONS)
  action?: AuditLogAction;

  @ApiPropertyOptional({ enum: AUDIT_LOG_ENTITY_TYPES })
  @IsOptional()
  @IsIn(AUDIT_LOG_ENTITY_TYPES)
  entityType?: AuditLogEntityType;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUuid('VALIDATION_FAILED')
  actorId?: Uuid;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUuid('VALIDATION_FAILED')
  entityId?: Uuid;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Inclusive createdAt lower bound (with timezone)',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description:
      'Inclusive createdAt upper bound (with timezone); must be >= from',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
