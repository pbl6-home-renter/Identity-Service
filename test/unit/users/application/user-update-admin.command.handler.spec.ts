import { UserUpdateAdminCommand } from 'modules/users/application/commands/user-update-admin/user-update-admin.command';
import { UserUpdateAdminCommandHandler } from 'modules/users/application/commands/user-update-admin/user-update-admin.command.handler';
import { User } from 'modules/users/domain/entities/user';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { PhoneAlreadyExistsException } from 'modules/users/domain/exceptions/phone-already-exists.exception';
import { UserUpdatePayloadRequiredException } from 'modules/users/domain/exceptions/user-update-payload-required.exception';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid, Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';

function setup() {
  const user = User.create({
    name: 'Tenant One',
    phone: Phone.create('0901234567'),
    email: Email.create('tenant@example.com'),
    password: 'hashed-password',
    role: UserRole.TENANT,
    status: UserStatus.ACTIVE,
  });
  const repository = {
    findById: jest.fn<Promise<User | null>, [Uuid]>().mockResolvedValue(user),
    findByPhone: jest
      .fn<Promise<User | null>, [Phone]>()
      .mockResolvedValue(null),
    save: jest.fn(async () => undefined),
  };
  const context: TransactionContext = { kind: 'transaction' };
  const unitOfWork: IUnitOfWork = {
    run: async <T>(work: (context: TransactionContext) => Promise<T>) =>
      work(context),
  };
  const outbox = { append: jest.fn(async () => undefined) };
  const handler = new UserUpdateAdminCommandHandler(
    repository as unknown as IUserRepository,
    unitOfWork,
    outbox as unknown as OutboxRepository,
  );
  const adminId = generateUuid();
  return { handler, user, adminId, repository, context, outbox };
}

describe('UserUpdateAdminCommandHandler changedFields', () => {
  it('reports both actual changes in name/phone order and keeps the original user snapshot', async () => {
    const { handler, user, adminId, repository, context, outbox } = setup();
    const result = await handler.execute(
      UserUpdateAdminCommand.create(adminId, user.id, {
        name: '  Tenant Two  ',
        phone: '+84912345678',
      }),
    );
    expect(result.changedFields).toEqual(['name', 'phone']);
    expect(result.user.name).toBe('Tenant Two');
    expect(result.user.phone.value).toBe('0912345678');
    expect(user.name).toBe('Tenant One');
    expect(user.phone.value).toBe('0901234567');
    expect(repository.save).toHaveBeenCalledWith(result.user, context);
    expect(outbox.append).toHaveBeenCalledWith(expect.any(Array), context);
  });

  it.each([
    { request: { name: 'Tenant Two' }, changedFields: ['name'] },
    { request: { phone: '0912345678' }, changedFields: ['phone'] },
    {
      request: { name: 'Tenant One', phone: '0912345678' },
      changedFields: ['phone'],
    },
    {
      request: { name: 'Tenant Two', phone: '+84901234567' },
      changedFields: ['name'],
    },
  ])(
    'reports only changed fields for $request',
    async ({ request, changedFields }) => {
      const { handler, user, adminId } = setup();
      const result = await handler.execute(
        UserUpdateAdminCommand.create(adminId, user.id, request),
      );
      expect(result.changedFields).toEqual(changedFields);
    },
  );

  it.each([
    { name: 'Tenant One' },
    { name: '  Tenant One  ' },
    { phone: '+84901234567' },
    { name: ' Tenant One ', phone: '  +84901234567  ' },
  ])(
    'reports no change for normalized-equivalent input %p',
    async (request) => {
      const { handler, user, adminId, repository } = setup();
      const result = await handler.execute(
        UserUpdateAdminCommand.create(adminId, user.id, request),
      );
      expect(result.changedFields).toEqual([]);
      expect(result.user.phone.equals(user.phone)).toBe(true);
      expect(repository.findByPhone).not.toHaveBeenCalled();
    },
  );

  it('preserves empty-payload validation', async () => {
    const { handler, user, adminId, repository } = setup();
    await expect(
      handler.execute(UserUpdateAdminCommand.create(adminId, user.id, {})),
    ).rejects.toBeInstanceOf(UserUpdatePayloadRequiredException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('preserves not-found and duplicate-phone errors', async () => {
    const { handler, user, adminId, repository } = setup();
    repository.findById.mockResolvedValueOnce(null);
    await expect(
      handler.execute(
        UserUpdateAdminCommand.create(adminId, user.id, { name: 'Changed' }),
      ),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    repository.findByPhone.mockResolvedValueOnce(
      User.create({
        name: 'Other',
        phone: Phone.create('0912345678'),
        email: Email.create('other@example.com'),
        password: 'hash',
        role: UserRole.TENANT,
        status: UserStatus.ACTIVE,
      }),
    );
    await expect(
      handler.execute(
        UserUpdateAdminCommand.create(adminId, user.id, {
          phone: '0912345678',
        }),
      ),
    ).rejects.toBeInstanceOf(PhoneAlreadyExistsException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
