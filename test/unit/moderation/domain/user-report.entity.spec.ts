import { UserReport } from 'modules/moderation/domain/entities/user-report';
import { UserReportContextType } from 'modules/moderation/domain/enums/user-report-context-type.enum';
import { UserReportStatus } from 'modules/moderation/domain/enums/user-report-status.enum';
import { ViolationCategory } from 'modules/moderation/domain/enums/violation-category.enum';
import { ReportNotPendingException } from 'modules/moderation/domain/exceptions/report-not-pending.exception';
import { ReportSelfException } from 'modules/moderation/domain/exceptions/report-self.exception';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function submit(
  overrides: Partial<Parameters<typeof UserReport.submit>[0]> = {},
) {
  return UserReport.submit({
    reporterId: generateUuid(),
    reportedUserId: generateUuid(),
    category: ViolationCategory.SPAM,
    description: 'Gửi quảng cáo liên tục.',
    evidenceMediaIds: [],
    contextType: null,
    contextId: null,
    ...overrides,
  });
}

describe('UserReport', () => {
  it('rejects reporting yourself', () => {
    const id = generateUuid();
    expect(() => submit({ reporterId: id, reportedUserId: id })).toThrow(
      ReportSelfException,
    );
  });

  it('drops a half-filled context', () => {
    const report = submit({
      contextType: UserReportContextType.CONVERSATION,
      contextId: null,
    });
    expect(report.contextType).toBeNull();
  });

  it('is resolved once, as dismissed or actioned', () => {
    const adminId = generateUuid();
    const dismissed = submit();
    dismissed.dismiss(adminId, null);
    expect(dismissed.status).toBe(UserReportStatus.DISMISSED);
    expect(dismissed.resolvedBy).toBe(adminId);
    expect(() => dismissed.markActioned(adminId, null)).toThrow(
      ReportNotPendingException,
    );

    const actioned = submit();
    actioned.markActioned(adminId, 'Đã khóa');
    expect(actioned.status).toBe(UserReportStatus.ACTIONED);
  });
});
