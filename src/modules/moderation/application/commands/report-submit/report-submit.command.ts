import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReportContextType } from '../../../domain/enums/user-report-context-type.enum';
import { ViolationCategory } from '../../../domain/enums/violation-category.enum';

export interface ReportSubmitInput {
  reportedUserId: Uuid;
  category: ViolationCategory;
  description: string;
  evidenceMediaIds?: Uuid[];
  contextType?: UserReportContextType | null;
  contextId?: Uuid | null;
}

export class ReportSubmitCommand implements ICommand {
  constructor(
    readonly reporterId: Uuid,
    readonly input: Required<ReportSubmitInput>,
  ) {}

  static create(
    reporterId: Uuid,
    input: ReportSubmitInput,
  ): ReportSubmitCommand {
    return new ReportSubmitCommand(reporterId, {
      reportedUserId: input.reportedUserId,
      category: input.category,
      description: input.description,
      evidenceMediaIds: input.evidenceMediaIds ?? [],
      contextType: input.contextType ?? null,
      contextId: input.contextId ?? null,
    });
  }
}
