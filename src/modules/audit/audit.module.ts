import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxModule } from 'modules/inbox/inbox.module';
import { AUDIT_RECORDER_DI_TOKEN } from './audit.di-token';
import { AuditExplorer } from './infrastructure/audit.explorer';
import { AuditLogTypeormEntity } from './infrastructure/persistence/audit-log.typeorm-entity';
import { TypeOrmAuditRecorder } from './infrastructure/persistence/audit-recorder';
import { BuildingReviewAuditSubscriber } from './presentation/messaging/building-review-audit.subscriber';

@Global()
@Module({
  imports: [
    DiscoveryModule,
    InboxModule,
    TypeOrmModule.forFeature([AuditLogTypeormEntity]),
  ],
  providers: [
    AuditExplorer,
    BuildingReviewAuditSubscriber,
    { provide: AUDIT_RECORDER_DI_TOKEN, useClass: TypeOrmAuditRecorder },
  ],
  exports: [AUDIT_RECORDER_DI_TOKEN],
})
export class AuditModule {}
