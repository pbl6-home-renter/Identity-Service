import { InvalidBuildingReviewEventException } from 'modules/audit/application/exceptions/invalid-building-review-event.exception';
import { toBuildingReviewAuditEntry } from 'modules/audit/application/mappers/building-review-audit.mapper';
import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

const buildingId = generateUuid();
const adminId = generateUuid();
const eventId = generateUuid();
const reviewedAt = '2026-11-24T09:30:00.000Z';

function event(
  eventType: string,
  payload: Record<string, unknown>,
): IntegrationEvent {
  return {
    id: eventId,
    eventType,
    routingKey: eventType,
    aggregateType: 'building',
    aggregateId: buildingId,
    payload,
    occurredAt: reviewedAt,
  };
}

describe('toBuildingReviewAuditEntry', () => {
  it('maps an approval with a null note and the review time', () => {
    const entry = toBuildingReviewAuditEntry(
      event('building.approved', {
        id: buildingId,
        reviewedBy: adminId,
        reviewedAt,
        note: null,
      }),
    );
    expect(entry).toEqual({
      action: 'building.approved',
      entityType: 'building',
      entityId: buildingId,
      actorId: adminId,
      metadata: { note: null },
      sourceService: 'tenancy',
      sourceEventId: eventId,
      occurredAt: new Date(reviewedAt),
    });
    expect(entry).not.toHaveProperty('createdAt');
  });

  it('maps a rejection note', () => {
    expect(
      toBuildingReviewAuditEntry(
        event('building.rejected', {
          reviewedBy: adminId,
          reviewedAt,
          note: 'Thiếu giấy phép',
        }),
      ).metadata,
    ).toEqual({ note: 'Thiếu giấy phép' });
  });

  it.each([
    ['missing reviewedBy', { reviewedAt, note: null }],
    ['invalid reviewedBy', { reviewedBy: 'bad', reviewedAt, note: null }],
    [
      'invalid reviewedAt',
      { reviewedBy: adminId, reviewedAt: 'bad', note: null },
    ],
    ['missing note', { reviewedBy: adminId, reviewedAt }],
  ])('rejects %s', (_case, payload) => {
    expect(() =>
      toBuildingReviewAuditEntry(event('building.approved', payload)),
    ).toThrow(InvalidBuildingReviewEventException);
  });

  it('rejects a rejection without a reason', () => {
    expect(() =>
      toBuildingReviewAuditEntry(
        event('building.rejected', {
          reviewedBy: adminId,
          reviewedAt,
          note: null,
        }),
      ),
    ).toThrow(InvalidBuildingReviewEventException);
  });
});
