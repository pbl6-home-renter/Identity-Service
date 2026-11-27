import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxModule } from 'modules/outbox/outbox.module';
import { UsersModule } from 'modules/users/users.module';
import { AppealAcceptCommandHandler } from './application/commands/appeal-accept/appeal-accept.command.handler';
import { AppealRejectCommandHandler } from './application/commands/appeal-reject/appeal-reject.command.handler';
import { AppealSubmitCommandHandler } from './application/commands/appeal-submit/appeal-submit.command.handler';
import { ReportResolveCommandHandler } from './application/commands/report-resolve/report-resolve.command.handler';
import { ReportSubmitCommandHandler } from './application/commands/report-submit/report-submit.command.handler';
import { AppealCloseOnUnlockEventHandler } from './application/event-handlers/appeal-close-on-unlock.event-handler';
import { AppealGetCurrentQueryHandler } from './application/queries/appeal-get-current/appeal-get-current.query.handler';
import { AppealGetDetailAdminQueryHandler } from './application/queries/appeal-get-detail-admin/appeal-get-detail-admin.query.handler';
import { AppealListAdminQueryHandler } from './application/queries/appeal-list-admin/appeal-list-admin.query.handler';
import { ReportGetDetailAdminQueryHandler } from './application/queries/report-get-detail-admin/report-get-detail-admin.query.handler';
import { ReportListAdminQueryHandler } from './application/queries/report-list-admin/report-list-admin.query.handler';
import { ModerationAttachmentService } from './application/services/moderation-attachment.service';
import { AccountAppealRepository } from './infrastructure/persistence/account-appeal.repository';
import { AccountAppealEntity } from './infrastructure/persistence/account-appeal.typeorm-entity';
import { UserReportRepository } from './infrastructure/persistence/user-report.repository';
import { UserReportEntity } from './infrastructure/persistence/user-report.typeorm-entity';
import { ModerationEmailComposer } from './infrastructure/services/moderation-email.composer';
import { ModerationQueryService } from './infrastructure/services/moderation-query.service';
import { MODERATION_DI_TOKEN } from './moderation.di-token';
import {
  AppealAdminController,
  MeAppealController,
} from './presentation/http/controllers/appeal.controller';
import { ReportController } from './presentation/http/controllers/report.controller';

/** Account appeals and violation reports (P13-11, P13-D109). */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AccountAppealEntity, UserReportEntity]),
    UsersModule,
    OutboxModule,
  ],
  controllers: [MeAppealController, AppealAdminController, ReportController],
  providers: [
    {
      provide: MODERATION_DI_TOKEN.APPEAL_REPOSITORY,
      useClass: AccountAppealRepository,
    },
    {
      provide: MODERATION_DI_TOKEN.REPORT_REPOSITORY,
      useClass: UserReportRepository,
    },
    {
      provide: MODERATION_DI_TOKEN.QUERY_SERVICE,
      useClass: ModerationQueryService,
    },
    {
      provide: MODERATION_DI_TOKEN.EMAIL_COMPOSER,
      useClass: ModerationEmailComposer,
    },
    ModerationAttachmentService,
    AppealSubmitCommandHandler,
    AppealAcceptCommandHandler,
    AppealRejectCommandHandler,
    ReportSubmitCommandHandler,
    ReportResolveCommandHandler,
    AppealGetCurrentQueryHandler,
    AppealListAdminQueryHandler,
    AppealGetDetailAdminQueryHandler,
    ReportListAdminQueryHandler,
    ReportGetDetailAdminQueryHandler,
    AppealCloseOnUnlockEventHandler,
  ],
})
export class ModerationModule {}
