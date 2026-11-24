import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditLogListQueryHandler } from './application/queries/audit-log-list/audit-log-list.query.handler';
import { AuditLogDetailQueryHandler } from './application/queries/audit-log-detail/audit-log-detail.query.handler';
import { AuditLogQueryService } from './infrastructure/services/audit-log-query.service';
import { AuditLogController } from './presentation/http/controllers/audit-log.controller';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxModule } from 'modules/inbox/inbox.module';
import {
  AUDIT_RECORDER_DI_TOKEN,
  AUDIT_LOG_QUERY_SERVICE_DI_TOKEN,
} from './audit.di-token';
import { AuditExplorer } from './infrastructure/audit.explorer';
import { AuditLogTypeormEntity } from './infrastructure/persistence/audit-log.typeorm-entity';
import { TypeOrmAuditRecorder } from './infrastructure/persistence/audit-recorder';
import { BuildingReviewAuditSubscriber } from './presentation/messaging/building-review-audit.subscriber';

@Global()
@Module({
  imports: [
    CqrsModule,
    DiscoveryModule,
    InboxModule,
    TypeOrmModule.forFeature([AuditLogTypeormEntity]),
  ],
  controllers: [AuditLogController],
  providers: [
    AuditLogListQueryHandler,
    AuditLogDetailQueryHandler,
    {
      provide: AUDIT_LOG_QUERY_SERVICE_DI_TOKEN,
      useClass: AuditLogQueryService,
    },
    AuditExplorer,
    BuildingReviewAuditSubscriber,
    { provide: AUDIT_RECORDER_DI_TOKEN, useClass: TypeOrmAuditRecorder },
  ],
  exports: [AUDIT_RECORDER_DI_TOKEN],
})
export class AuditModule {}
