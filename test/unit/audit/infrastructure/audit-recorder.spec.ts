import { EntityManager, Repository } from 'typeorm';
import { AuditEntry } from 'modules/audit/application/audit-entry';
import { AuditLogTypeormEntity } from 'modules/audit/infrastructure/persistence/audit-log.typeorm-entity';
import { TypeOrmAuditRecorder } from 'modules/audit/infrastructure/persistence/audit-recorder';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { TypeOrmTransactionContext } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

function setup() {
  const builder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orUpdate: jest.fn().mockReturnThis(),
    execute: jest.fn(async () => undefined),
  };
  const repository = { createQueryBuilder: jest.fn() };
  const transactionalRepository = {
    createQueryBuilder: jest.fn(() => builder),
  };
  const manager = { withRepository: jest.fn(() => transactionalRepository) };
  const context = new TypeOrmTransactionContext(
    manager as unknown as EntityManager,
  );
  const run = jest.fn(
    async (work: (context: TransactionContext) => Promise<void>) =>
      work(context),
  );
  const recorder = new TypeOrmAuditRecorder(
    repository as unknown as Repository<AuditLogTypeormEntity>,
    { run } as IUnitOfWork,
  );
  return {
    recorder,
    builder,
    repository,
    transactionalRepository,
    manager,
    context,
    run,
  };
}

describe('TypeOrmAuditRecorder', () => {
  const entry: AuditEntry = {
    action: 'user.locked',
    entityType: 'user',
    entityId: null,
    actorId: null,
    metadata: {
      lockReason: 'Spam',
      phone: '0901234567',
      password: 'sensitive',
    },
  };

  it('opens its own unit of work and filters metadata before inserting', async () => {
    const { recorder, builder, run, manager, repository } = setup();
    await recorder.record(entry);
    expect(run).toHaveBeenCalledTimes(1);
    expect(manager.withRepository).toHaveBeenCalledWith(repository);
    expect(builder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { lockReason: 'Spam' },
        sourceService: 'identity',
        sourceEventId: null,
        occurredAt: expect.any(Date),
      }),
    );
    expect(builder.execute).toHaveBeenCalledTimes(1);
    expect(builder.orUpdate).not.toHaveBeenCalled();
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('uses the supplied context without opening a separate transaction', async () => {
    const { recorder, builder, run, manager, repository, context } = setup();
    const occurredAt = new Date('2026-01-01T00:00:00Z');
    await recorder.record(
      {
        action: 'building.approved',
        entityType: 'building',
        actorId: null,
        entityId: null,
        metadata: { note: null },
        sourceService: 'tenancy',
        sourceEventId: 'event-id',
        occurredAt,
      },
      context,
    );
    expect(run).not.toHaveBeenCalled();
    expect(manager.withRepository).toHaveBeenCalledWith(repository);
    expect(builder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceService: 'tenancy',
        sourceEventId: 'event-id',
        occurredAt,
        metadata: { note: null },
      }),
    );
    expect(builder.orUpdate).toHaveBeenCalledWith([], ['source_event_id']);
    expect(builder.execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ...entry, action: 'unsupported' },
    { ...entry, metadata: { lockReason: 123 } },
    { ...entry, sourceService: 'community' },
    { ...entry, sourceService: null },
  ])(
    'validates before opening a transaction or executing SQL',
    async (invalid) => {
      const { recorder, builder, run, manager, context } = setup();
      await expect(recorder.record(invalid as AuditEntry)).rejects.toThrow();
      await expect(
        recorder.record(invalid as AuditEntry, context),
      ).rejects.toThrow();
      expect(run).not.toHaveBeenCalled();
      expect(manager.withRepository).not.toHaveBeenCalled();
      expect(builder.execute).not.toHaveBeenCalled();
    },
  );

  it('propagates database failures instead of suppressing other conflicts', async () => {
    const { recorder, builder } = setup();
    const error = new Error('another unique constraint failed');
    builder.execute.mockRejectedValueOnce(error);
    await expect(
      recorder.record({ ...entry, sourceEventId: 'event-id' }),
    ).rejects.toBe(error);
    expect(builder.orUpdate).toHaveBeenCalledWith([], ['source_event_id']);
  });
});
