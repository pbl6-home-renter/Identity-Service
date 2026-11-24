import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { AuditEntry } from '../../application/audit-entry';
import { AuditRecorder } from '../../application/ports/audit-recorder.port';
import { AuditLogTypeormEntity } from './audit-log.typeorm-entity';
import { sanitizeAuditMetadata } from './audit-metadata';

@Injectable()
export class TypeOrmAuditRecorder implements AuditRecorder {
  constructor(
    @InjectRepository(AuditLogTypeormEntity)
    private readonly repository: Repository<AuditLogTypeormEntity>,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async record(entry: AuditEntry, context?: TransactionContext): Promise<void> {
    const sourceService =
      entry.sourceService === undefined ? 'identity' : entry.sourceService;
    if (sourceService !== 'identity' && sourceService !== 'tenancy') {
      throw new Error('Unsupported audit source service');
    }
    const sanitizedEntry: AuditEntry = {
      ...entry,
      sourceService,
      occurredAt: entry.occurredAt ?? new Date(),
      metadata: sanitizeAuditMetadata(entry.action, entry.metadata),
    };
    return context
      ? this.insert(sanitizedEntry, context)
      : this.unitOfWork.run((transaction) =>
          this.insert(sanitizedEntry, transaction),
        );
  }

  private async insert(
    entry: AuditEntry,
    context: TransactionContext,
  ): Promise<void> {
    const insert = withTransaction(this.repository, context)
      .createQueryBuilder()
      .insert()
      .into(AuditLogTypeormEntity)
      .values({
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId as Uuid | null,
        actorId: entry.actorId as Uuid | null,
        metadata: entry.metadata,
        sourceService: entry.sourceService,
        occurredAt: entry.occurredAt,
        sourceEventId: entry.sourceEventId ?? null,
      } as QueryDeepPartialEntity<AuditLogTypeormEntity>);

    if (entry.sourceEventId !== undefined) {
      // An empty overwrite list emits DO NOTHING for this conflict target only.
      insert.orUpdate([], ['source_event_id']);
    }
    await insert.execute();
  }
}
