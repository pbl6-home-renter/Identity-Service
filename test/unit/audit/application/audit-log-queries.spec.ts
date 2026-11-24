import { generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { AuditLogListQuery } from 'modules/audit/application/queries/audit-log-list/audit-log-list.query';
import { AuditLogListQueryHandler } from 'modules/audit/application/queries/audit-log-list/audit-log-list.query.handler';
import { AuditLogDetailQuery } from 'modules/audit/application/queries/audit-log-detail/audit-log-detail.query';
import { AuditLogDetailQueryHandler } from 'modules/audit/application/queries/audit-log-detail/audit-log-detail.query.handler';
import { AuditLogNotFoundException } from 'modules/audit/domain/exceptions/audit-log-not-found.exception';
import { ValidationException } from 'shared/domain/exceptions/validation.exception';

describe('Audit log queries', () => {
  const service = { findAuditLogsAdmin: jest.fn(), findById: jest.fn() };
  beforeEach(() => jest.resetAllMocks());

  it('compares parsed instants across timezone offsets and accepts equality', () => {
    expect(() =>
      AuditLogListQuery.create({
        pageNo: 1,
        pageSize: 20,
        from: '2026-11-24T10:00:00+07:00',
        to: '2026-11-24T03:00:00Z',
      }),
    ).not.toThrow();
    expect(() =>
      AuditLogListQuery.create({
        pageNo: 1,
        pageSize: 20,
        from: '2026-11-24T04:00:00Z',
        to: '2026-11-24T10:00:00+07:00',
      }),
    ).toThrow(ValidationException);
  });

  it('rejects invalid dates before querying', () => {
    expect(() =>
      AuditLogListQuery.create({ pageNo: 1, pageSize: 20, from: 'bad' }),
    ).toThrow(ValidationException);
  });

  it('passes all filters and pagination to the read port', async () => {
    const actorId = generateUuid();
    const entityId = generateUuid();
    const query = AuditLogListQuery.create({
      pageNo: 2,
      pageSize: 10,
      action: 'building.approved',
      entityType: 'building',
      actorId,
      entityId,
      from: '2026-11-24T03:00:00Z',
      to: '2026-11-24T04:00:00Z',
    });
    const result = { data: [], pagination: { totalItems: 0 } };
    service.findAuditLogsAdmin.mockResolvedValue(result);
    expect(await new AuditLogListQueryHandler(service).execute(query)).toBe(
      result,
    );
    expect(service.findAuditLogsAdmin).toHaveBeenCalledWith({
      pageNo: 2,
      pageSize: 10,
      action: 'building.approved',
      entityType: 'building',
      actorId,
      entityId,
      from: new Date('2026-11-24T03:00:00Z'),
      to: new Date('2026-11-24T04:00:00Z'),
    });
  });

  it('returns detail from the port and throws the domain not-found exception', async () => {
    const handler = new AuditLogDetailQueryHandler(service);
    const auditLogId = generateUuid();
    const query = AuditLogDetailQuery.create(auditLogId);
    const result = { id: auditLogId, metadata: { note: 'Approved' } };
    service.findById.mockResolvedValue(result);
    expect(await handler.execute(query)).toBe(result);
    expect(service.findById).toHaveBeenCalledWith(auditLogId);
    service.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toMatchObject({
      statusCode: 404,
      code: 'AUDIT_LOG_NOT_FOUND',
    });
    await expect(handler.execute(query)).rejects.toThrow(
      AuditLogNotFoundException,
    );
  });
});
