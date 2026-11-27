import { UserActiveAdminIdsInternalQueryHandler } from 'modules/users/application/queries/user-active-admin-ids-internal/user-active-admin-ids-internal.query.handler';
import { IUserQueryService } from 'modules/users/application/ports/user-query-service.port';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('UserActiveAdminIdsInternalQueryHandler', () => {
  it('returns every active admin ID supplied by the query service', async () => {
    const ids = [generateUuid(), generateUuid()];
    const findActiveAdminIds = jest.fn().mockResolvedValue(ids);
    const handler = new UserActiveAdminIdsInternalQueryHandler({
      findActiveAdminIds,
    } as unknown as IUserQueryService);

    await expect(handler.execute()).resolves.toEqual(ids);
    expect(findActiveAdminIds).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when no admins are active', async () => {
    const handler = new UserActiveAdminIdsInternalQueryHandler({
      findActiveAdminIds: jest.fn().mockResolvedValue([]),
    } as unknown as IUserQueryService);

    await expect(handler.execute()).resolves.toEqual([]);
  });
});
