import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReportResolveAction } from '../../../domain/enums/user-report-resolve-action.enum';

export interface ReportResolveInput {
  action: UserReportResolveAction;
  note?: string | null;
  lockReason?: string | null;
}

export class ReportResolveCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly reportId: Uuid,
    readonly action: UserReportResolveAction,
    readonly note: string | null,
    readonly lockReason: string | null,
  ) {}

  static create(
    adminId: Uuid,
    reportId: Uuid,
    input: ReportResolveInput,
  ): ReportResolveCommand {
    return new ReportResolveCommand(
      adminId,
      reportId,
      input.action,
      input.note || null,
      input.lockReason || null,
    );
  }
}
