import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AUDIT_LOG_ACTIONS } from '../../../application/queries/models/audit-log-action';
import { AUDIT_LOG_ENTITY_TYPES } from '../../../application/queries/models/audit-log-entity-type';
import { AuditLogListItem } from '../../../application/queries/models/audit-log-list-item.model';

export class AuditLogListResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: Uuid;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  actorId: Uuid | null;

  @ApiProperty({ type: String, nullable: true })
  actorName: string | null;

  @ApiProperty({ enum: AUDIT_LOG_ACTIONS })
  action: string;

  @ApiProperty({ enum: AUDIT_LOG_ENTITY_TYPES })
  entityType: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  entityId: Uuid | null;

  @ApiProperty({ enum: ['identity', 'tenancy'] })
  sourceService: 'identity' | 'tenancy';

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  static fromResult(item: AuditLogListItem): AuditLogListResponseDto {
    const dto = new AuditLogListResponseDto();
    dto.id = item.id;
    dto.actorId = item.actorId;
    dto.actorName = item.actorName;
    dto.action = item.action;
    dto.entityType = item.entityType;
    dto.entityId = item.entityId;
    dto.sourceService = item.sourceService;
    dto.createdAt = item.createdAt.toISOString();
    return dto;
  }
}
