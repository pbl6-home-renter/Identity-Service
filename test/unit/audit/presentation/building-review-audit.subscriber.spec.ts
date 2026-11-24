import { BuildingReviewAuditSubscriber } from 'modules/audit/presentation/messaging/building-review-audit.subscriber';
import { AuditRecorder } from 'modules/audit/application/ports/audit-recorder.port';
import { InboxRepository } from 'modules/inbox/application/ports/inbox.repository';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

jest.mock('@golevelup/nestjs-rabbitmq', () => ({
  RabbitSubscribe: () => () => undefined,
}));

const reviewedAt = '2026-11-24T09:30:00.000Z';

function reviewEvent(): IntegrationEvent {
  const eventType = 'building.rejected';
  return {
    id: generateUuid(),
    eventType,
    routingKey: eventType,
    aggregateType: 'building',
    aggregateId: generateUuid(),
    payload: {
      reviewedBy: generateUuid(),
      reviewedAt,
      note: 'Thiếu giấy phép',
    },
    occurredAt: reviewedAt,
  };
}

describe('BuildingReviewAuditSubscriber', () => {
  it('records audit once for a duplicate delivery using the inbox transaction', async () => {
    const context = {} as TransactionContext;
    const recordIfNew = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const record = jest.fn().mockResolvedValue(undefined);
    const run = jest.fn(
      async (work: (context: TransactionContext) => Promise<void>) =>
        work(context),
    );
    const subscriber = new BuildingReviewAuditSubscriber(
      { recordIfNew } as unknown as InboxRepository,
      { run } as IUnitOfWork,
      { record } as unknown as AuditRecorder,
    );
    const message = reviewEvent();

    await subscriber.handle(message);
    await subscriber.handle(message);

    expect(run).toHaveBeenCalledTimes(2);
    expect(recordIfNew).toHaveBeenNthCalledWith(
      1,
      message.id,
      message.eventType,
      context,
    );
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceEventId: message.id,
        occurredAt: new Date(reviewedAt),
      }),
      context,
    );
  });

  it('propagates audit failure so the inbox transaction can roll back and retry', async () => {
    const committed = new Set<string>();
    let pending: Set<string>;
    const recordIfNew = jest.fn(async (id: string) => {
      if (committed.has(id)) return false;
      pending.add(id);
      return true;
    });
    const record = jest
      .fn()
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(undefined);
    const run = jest.fn(
      async (work: (context: TransactionContext) => Promise<void>) => {
        pending = new Set(committed);
        await work({} as TransactionContext);
        for (const id of pending) committed.add(id);
      },
    );
    const subscriber = new BuildingReviewAuditSubscriber(
      { recordIfNew } as unknown as InboxRepository,
      { run } as IUnitOfWork,
      { record } as unknown as AuditRecorder,
    );
    const message = reviewEvent();

    await expect(subscriber.handle(message)).rejects.toThrow(
      'database unavailable',
    );
    expect(committed.has(message.id)).toBe(false);
    await subscriber.handle(message);
    expect(committed.has(message.id)).toBe(true);
    expect(record).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed payloads before marking them processed', async () => {
    const recordIfNew = jest.fn();
    const run = jest.fn();
    const record = jest.fn();
    const subscriber = new BuildingReviewAuditSubscriber(
      { recordIfNew } as unknown as InboxRepository,
      { run } as unknown as IUnitOfWork,
      { record } as unknown as AuditRecorder,
    );
    const message = reviewEvent();
    message.payload.reviewedBy = null;

    await expect(subscriber.handle(message)).rejects.toThrow(
      'Invalid building review event: reviewedBy',
    );
    expect(run).not.toHaveBeenCalled();
    expect(recordIfNew).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });
});
