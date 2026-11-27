import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid, generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReportContextType } from '../enums/user-report-context-type.enum';
import { UserReportStatus } from '../enums/user-report-status.enum';
import { ViolationCategory } from '../enums/violation-category.enum';
import { ReportNotPendingException } from '../exceptions/report-not-pending.exception';
import { ReportSelfException } from '../exceptions/report-self.exception';
import { UserReportProps, UserReportSubmitInput } from './user-report.props';

/** A user's report that another account broke the rules (P13-D109). */
export class UserReport extends AggregateRoot {
  private constructor(private readonly props: UserReportProps) {
    super(props.id, props.createdAt, props.updatedAt);
  }

  get reporterId(): Uuid {
    return this.props.reporterId;
  }
  get reportedUserId(): Uuid {
    return this.props.reportedUserId;
  }
  get category(): ViolationCategory {
    return this.props.category;
  }
  get description(): string {
    return this.props.description;
  }
  get evidenceMediaIds(): Uuid[] {
    return [...this.props.evidenceMediaIds];
  }
  get contextType(): UserReportContextType | null {
    return this.props.contextType;
  }
  get contextId(): Uuid | null {
    return this.props.contextId;
  }
  get status(): UserReportStatus {
    return this.props.status;
  }
  get resolutionNote(): string | null {
    return this.props.resolutionNote;
  }
  get resolvedBy(): Uuid | null {
    return this.props.resolvedBy;
  }
  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }
  get isPending(): boolean {
    return this.props.status === UserReportStatus.PENDING;
  }

  static submit(input: UserReportSubmitInput, now = new Date()): UserReport {
    if (input.reporterId === input.reportedUserId) {
      throw new ReportSelfException();
    }
    const hasContext = input.contextType !== null && input.contextId !== null;
    return new UserReport({
      ...input,
      contextType: hasContext ? input.contextType : null,
      contextId: hasContext ? input.contextId : null,
      evidenceMediaIds: [...new Set(input.evidenceMediaIds)],
      id: generateUuid(),
      status: UserReportStatus.PENDING,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserReportProps): UserReport {
    return new UserReport(props);
  }

  dismiss(adminId: Uuid, note: string | null, now = new Date()): void {
    this.resolve(UserReportStatus.DISMISSED, adminId, note, now);
  }

  /** The reported account was locked because of (or while) this report was open. */
  markActioned(adminId: Uuid, note: string | null, now = new Date()): void {
    this.resolve(UserReportStatus.ACTIONED, adminId, note, now);
  }

  toProps(): UserReportProps {
    return { ...this.props, evidenceMediaIds: this.evidenceMediaIds };
  }

  private resolve(
    status: UserReportStatus,
    adminId: Uuid,
    note: string | null,
    now: Date,
  ): void {
    if (!this.isPending) {
      throw new ReportNotPendingException();
    }
    this.props.status = status;
    this.props.resolutionNote = note;
    this.props.resolvedBy = adminId;
    this.props.resolvedAt = now;
    this.props.updatedAt = now;
  }
}
