import { UserStatsQueryHandler } from 'modules/users/application/queries/user-stats/user-stats.query.handler';
import { IUserQueryService } from 'modules/users/application/ports/user-query-service.port';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';

describe('UserStatsQueryHandler', () => {
  const countUsersByRoleAndStatus = jest.fn();
  const handler = new UserStatsQueryHandler({
    countUsersByRoleAndStatus,
  } as unknown as IUserQueryService);

  beforeEach(() => countUsersByRoleAndStatus.mockReset());

  it('aggregates counts by role and status with the public response keys', async () => {
    countUsersByRoleAndStatus.mockResolvedValue([
      { role: UserRole.ADMIN, status: UserStatus.ACTIVE, count: 1 },
      { role: UserRole.LANDLORD, status: UserStatus.ACTIVE, count: 2 },
      { role: UserRole.LANDLORD, status: UserStatus.LOCKED, count: 1 },
      { role: UserRole.TENANT, status: UserStatus.ACTIVE, count: 3 },
      {
        role: UserRole.TENANT,
        status: UserStatus.PENDING_VERIFICATION,
        count: 2,
      },
    ]);

    const result = await handler.execute();

    expect(result).toEqual({
      totalUsers: 9,
      byRole: { admin: 1, landlord: 3, tenant: 5 },
      byStatus: { active: 6, locked: 1, pendingVerification: 2 },
      generatedAt: expect.any(String),
    });
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });

  it('returns every key with zero when there are no users', async () => {
    countUsersByRoleAndStatus.mockResolvedValue([]);

    await expect(handler.execute()).resolves.toEqual({
      totalUsers: 0,
      byRole: { admin: 0, landlord: 0, tenant: 0 },
      byStatus: { active: 0, locked: 0, pendingVerification: 0 },
      generatedAt: expect.any(String),
    });
  });
});
