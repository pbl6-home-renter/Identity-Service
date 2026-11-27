import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { UserReport } from '../../../domain/entities/user-report';
import { ReportAlreadyPendingException } from '../../../domain/exceptions/report-already-pending.exception';
import { ReportSelfException } from '../../../domain/exceptions/report-self.exception';
import { IUserReportRepository } from '../../../domain/repositories/user-report.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { ModerationAttachmentService } from '../../services/moderation-attachment.service';
import { ReportSubmitCommand } from './report-submit.command';

@CommandHandler(ReportSubmitCommand)
export class ReportSubmitCommandHandler implements ICommandHandler<
  ReportSubmitCommand,
  UserReport
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MODERATION_DI_TOKEN.REPORT_REPOSITORY)
    private readonly reportRepository: IUserReportRepository,
    private readonly attachments: ModerationAttachmentService,
  ) {}

  async execute({
    reporterId,
    input,
  }: ReportSubmitCommand): Promise<UserReport> {
    if (reporterId === input.reportedUserId) {
      throw new ReportSelfException();
    }
    // Admin accounts are not reportable; answer as if they did not exist.
    const reported = await this.userRepository.findById(input.reportedUserId);
    if (!reported || reported.role === UserRole.ADMIN) {
      throw new UserNotFoundException();
    }
    if (await this.reportRepository.hasPending(reporterId, reported.id)) {
      throw new ReportAlreadyPendingException();
    }
    await this.attachments.assertOwnUploads(
      reporterId,
      input.evidenceMediaIds,
      MediaPurpose.REPORT_EVIDENCE,
    );

    const report = UserReport.submit({ reporterId, ...input });
    await this.reportRepository.save(report);
    return report;
  }
}
