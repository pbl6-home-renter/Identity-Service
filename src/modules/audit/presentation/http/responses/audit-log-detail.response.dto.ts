import { ApiProperty } from '@nestjs/swagger';
import { AuditLogDetail } from '../../../application/queries/models/audit-log-detail.model';
import { AuditLogListResponseDto } from './audit-log-list.response.dto';

export class AuditLogDetailResponseDto extends AuditLogListResponseDto {
  @ApiProperty({ type: Object })
  metadata: Record<string, unknown>;

  static override fromResult(item: AuditLogDetail): AuditLogDetailResponseDto {
    const dto = new AuditLogDetailResponseDto();
    Object.assign(dto, AuditLogListResponseDto.fromResult(item));
    dto.metadata = item.metadata;
    return dto;
  }
}
