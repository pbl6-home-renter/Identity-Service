import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuditLogListQueryRequestDto } from 'modules/audit/presentation/http/requests/audit-log-list.query.request.dto';

jest.mock('@nestjs/swagger', () => ({
  ApiPropertyOptional: () => () => undefined,
}));

describe('Audit list query validation', () => {
  it.each([
    { action: 'user.lock' },
    { entityType: 'payment' },
    { actorId: 'invalid' },
    { entityId: 'invalid' },
    { from: 'invalid' },
    { to: '2026-11-24' },
    { from: '2026-02-30T03:00:00Z' },
    { to: '2026-11-24T03:00:00' },
    { pageSize: 101 },
    { pageSize: 0 },
    { pageNo: 0 },
    { pageNo: -1 },
    { pageSize: 'abc' },
    { pageNo: 1.5 },
    { pageSize: 1.5 },
    { actorId: ['bad', 'bad'] },
    { from: ['2026-11-24T03:00:00Z'] },
  ])('rejects invalid query %j', async (input) => {
    expect(
      await validate(plainToInstance(AuditLogListQueryRequestDto, input)),
    ).not.toHaveLength(0);
  });

  it('uses defaults and accepts all supported actions', async () => {
    for (const action of [
      'user.locked',
      'user.unlocked',
      'user.updated',
      'user.deleted',
      'building.approved',
      'building.rejected',
    ]) {
      const dto = plainToInstance(AuditLogListQueryRequestDto, { action });
      expect(dto.pageNo).toBe(1);
      expect(dto.pageSize).toBe(20);
      expect(await validate(dto)).toHaveLength(0);
    }
  });

  it.each(['sort', 'order', 'filter', 'format', 'role'])(
    'rejects unsupported query %s',
    async (field) => {
      const dto = plainToInstance(AuditLogListQueryRequestDto, {
        [field]: 'anything',
      });
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      expect(errors[0].constraints).toHaveProperty('whitelistValidation');
    },
  );
});
