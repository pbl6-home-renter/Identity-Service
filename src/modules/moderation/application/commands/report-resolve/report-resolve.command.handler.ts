import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { ValidationException } from 'shared/domain/exceptions/validation.exception';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Audited } from 'modules/audit/application/audited.decorator';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { UserReport } from '../../../domain/entities/user-report';
import { UserReportResolveAction } from '../../../domain/enums/user-report-resolve-action.enum';
import { ReportNotFoundException } from '../../../domain/exceptions/report-not-found.exception';
import { ReportNotPendingException } from '../../../domain/exceptions/report-not-pending.exception';
import { IUserReportRepository } from '../../../domain/repositories/user-report.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { ReportResolveCommand } from './report-resolve.command';

export interface ReportResolveResult {
  report: UserReport;
  /** True when this call locked the reported account. */
  locked: boolean;
  lockReason: string | null;
}

/**
 * `dismiss` closes one report. `lock` locks the reported account with the
 * existing lock rules and closes every pending report about it (P13-D109).
 */
@CommandHandler(ReportResolveCommand)
export class ReportResolveCommandHandler implements ICommandHandler<
  ReportResolveCommand,
  ReportResolveResult
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.REPORT_REPOSITORY)
    private readonly reportRepository: IUserReportRepository,
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
  ) {}

  @Audited<ReportResolveCommand, ReportResolveResult>({
    action: 'user.locked',
    entityType: 'user',
    actorId: (command) => command.adminId,
    entityId: (_command, result) => result.report.reportedUserId,
    metadata: (_command, result) => ({
      lockReason: result.lockReason,
      reportId: result.report.id,
    }),
    skipIf: (_command, result) => !result.locked,
  })
  async execute(command: ReportResolveCommand): Promise<ReportResolveResult> {
    if (
      command.action === UserReportResolveAction.LOCK &&
      !command.lockReason
    ) {
      throw new ValidationException('lockReason is required to lock');
    }

    return this.unitOfWork.run(async (context) => {
      const report = await this.reportRepository.findByIdForUpdate(
        command.reportId,
        context,
      );
      if (!report) throw new ReportNotFoundException();
      if (!report.isPending) throw new ReportNotPendingException();

      if (command.action === UserReportResolveAction.DISMISS) {
        report.dismiss(command.adminId, command.note);
        await this.reportRepository.save(report, context);
        return { report, locked: false, lockReason: null };
      }

      const user = await this.userRepository.findByIdForUpdate(
        report.reportedUserId,
        context,
      );
      if (!user) throw new UserNotFoundException();

      // Already locked (e.g. from the user page): only close the reports.
      const locked = user.status !== UserStatus.LOCKED;
      if (locked) {
        user.lock(command.lockReason!);
        await this.userRepository.save(user, context);
        await this.userRepository.recordLockPeriod(
          user.id,
          user.lockedAt!,
          context,
        );
        await this.outboxRepository.append(
          user
            .pullDomainEvents()
            .map((event) => OutboxMessage.fromDomainEvent(event)),
          context,
        );
      }

      const pending = await this.reportRepository.findPendingByReportedUser(
        user.id,
        context,
      );
      for (const item of pending) {
        item.markActioned(command.adminId, command.note);
        await this.reportRepository.save(item, context);
      }
      const resolved = pending.find((item) => item.id === report.id) ?? report;
      return { report: resolved, locked, lockReason: user.lockReason };
    });
  }
}
