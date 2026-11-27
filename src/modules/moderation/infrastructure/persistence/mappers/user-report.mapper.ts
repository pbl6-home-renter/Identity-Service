import { UserReport } from '../../../domain/entities/user-report';
import { UserReportEntity } from '../user-report.typeorm-entity';

export class UserReportMapper {
  static toDomain(raw: UserReportEntity): UserReport {
    return UserReport.reconstitute({
      id: raw.id,
      reporterId: raw.reporterId,
      reportedUserId: raw.reportedUserId,
      category: raw.category,
      description: raw.description,
      evidenceMediaIds: raw.evidenceMediaIds ?? [],
      contextType: raw.contextType,
      contextId: raw.contextId,
      status: raw.status,
      resolutionNote: raw.resolutionNote,
      resolvedBy: raw.resolvedBy,
      resolvedAt: raw.resolvedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(report: UserReport): UserReportEntity {
    const raw = new UserReportEntity();
    Object.assign(raw, report.toProps());
    raw.isDeleted = false;
    return raw;
  }
}
