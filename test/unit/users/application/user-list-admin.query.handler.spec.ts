import { UserListAdminQuery } from 'modules/users/application/queries/user-list-admin/user-list-admin.query';
import { UserListAdminQueryHandler } from 'modules/users/application/queries/user-list-admin/user-list-admin.query.handler';
import { IUserQueryService } from 'modules/users/application/ports/user-query-service.port';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';

describe('UserListAdminQueryHandler', () => {
  it('forwards pagination, sorting and filters to the admin read port', async () => {
    const result = { items: [], total: 0, pageNo: 2, pageSize: 25 };
    const userQueryService: IUserQueryService = {
      findUsersAdmin: jest.fn(async () => result),
    } as unknown as IUserQueryService;
    const handler = new UserListAdminQueryHandler(userQueryService);

    await expect(
      handler.execute(
        new UserListAdminQuery(
          2,
          25,
          'createdAt',
          'desc',
          UserRole.TENANT,
          UserStatus.ACTIVE,
          'tenant',
        ),
      ),
    ).resolves.toBe(result);

    expect(userQueryService.findUsersAdmin).toHaveBeenCalledWith({
      pageNo: 2,
      pageSize: 25,
      sort: 'createdAt',
      order: 'desc',
      filter: {
        role: UserRole.TENANT,
        status: UserStatus.ACTIVE,
        searchKeyword: 'tenant',
      },
    });
  });
});
