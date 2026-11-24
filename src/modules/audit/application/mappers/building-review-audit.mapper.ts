import { IntegrationEvent } from 'shared/application/messaging/integration-event';
import { isValidUuid } from 'shared/domain/value-objects/uuid.vo';
import { AuditEntry } from '../audit-entry';
import { InvalidBuildingReviewEventException } from '../exceptions/invalid-building-review-event.exception';

const REVIEW_EVENTS = ['building.approved', 'building.rejected'] as const;

export function toBuildingReviewAuditEntry(
  event: IntegrationEvent,
): AuditEntry {
  if (!REVIEW_EVENTS.some((type) => type === event.eventType)) {
    throw new InvalidBuildingReviewEventException('eventType');
  }
  if (!isValidUuid(event.id)) {
    throw new InvalidBuildingReviewEventException('id');
  }
  if (!isValidUuid(event.aggregateId)) {
    throw new InvalidBuildingReviewEventException('aggregateId');
  }
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new InvalidBuildingReviewEventException('payload');
  }
  if (
    typeof payload.reviewedBy !== 'string' ||
    !isValidUuid(payload.reviewedBy)
  ) {
    throw new InvalidBuildingReviewEventException('reviewedBy');
  }
  const reviewedAt = payload.reviewedAt;
  if (
    typeof reviewedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      reviewedAt,
    ) ||
    Number.isNaN(Date.parse(reviewedAt))
  ) {
    throw new InvalidBuildingReviewEventException('reviewedAt');
  }
  const note = payload.note;
  if (
    (event.eventType === 'building.rejected' &&
      (typeof note !== 'string' || note.trim().length === 0)) ||
    (event.eventType === 'building.approved' &&
      note !== null &&
      typeof note !== 'string')
  ) {
    throw new InvalidBuildingReviewEventException('note');
  }

  return {
    action: event.eventType,
    entityType: 'building',
    entityId: event.aggregateId,
    actorId: payload.reviewedBy,
    metadata: { note },
    sourceService: 'tenancy',
    sourceEventId: event.id,
    occurredAt: new Date(reviewedAt),
  };
}
