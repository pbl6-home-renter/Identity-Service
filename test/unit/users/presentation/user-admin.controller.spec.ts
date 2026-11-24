import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserAdminController } from 'modules/users/presentation/http/controllers/user-admin.controller';
import { UserUpdateAdminCommand } from 'modules/users/application/commands/user-update-admin/user-update-admin.command';
import { UserUnlockCommand } from 'modules/users/application/commands/user-unlock/user-unlock.command';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { AuthenticatedUser } from 'shared/application/auth/authenticated-user';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

// The repository maps Nest runtime packages to lightweight unit-test shims.
jest.mock('@nestjs/common', () => {
  const decorator = () => () => undefined;
  return {
    ...jest.requireActual('@nestjs/common'),
    Controller: decorator,
    Body: decorator,
    Param: decorator,
    Query: decorator,
    Get: decorator,
    Post: decorator,
    Patch: decorator,
    Delete: decorator,
    HttpCode: decorator,
    SetMetadata: decorator,
    applyDecorators: decorator,
    createParamDecorator: () => decorator,
    ParseUUIDPipe: jest.fn(),
    HttpStatus: { OK: 200, NO_CONTENT: 204 },
  };
});
jest.mock('@nestjs/swagger', () => {
  const decorator = () => () => undefined;
  return {
    ApiTags: decorator,
    ApiBearerAuth: decorator,
    ApiOperation: decorator,
    ApiResponse: decorator,
    ApiProperty: decorator,
    ApiPropertyOptional: decorator,
    ApiExtraModels: decorator,
    getSchemaPath: (model: { name: string }) => model.name,
  };
});

function setup() {
  const user = User.create({
    name: 'Updated User',
    phone: Phone.create('0912345678'),
    email: Email.create('user@example.com'),
    password: 'private-hash',
    role: UserRole.TENANT,
    status: UserStatus.ACTIVE,
  });
  const admin = {
    id: generateUuid(),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  } as AuthenticatedUser;
  const commandBus = { execute: jest.fn() };
  const queryBus = { execute: jest.fn() };
  const controller = new UserAdminController(
    queryBus as unknown as QueryBus,
    commandBus as unknown as CommandBus,
  );
  return { controller, commandBus, user, admin };
}

describe('UserAdminController audit context and response', () => {
  it('keeps the existing update response without exposing changedFields or user internals', async () => {
    const { controller, commandBus, user, admin } = setup();
    commandBus.execute.mockResolvedValue({
      user,
      changedFields: ['name', 'phone'],
    });
    const response = await controller.updateUser(admin, user.id, {
      name: user.name,
      phone: user.phone.value,
    });
    expect(response).toEqual({
      userId: user.id,
      name: user.name,
      phone: user.phone.value,
      email: user.email.value,
      status: user.status,
    });
    expect(response).not.toHaveProperty('changedFields');
    expect(response).not.toHaveProperty('password');
    expect(commandBus.execute).toHaveBeenCalledWith(
      new UserUpdateAdminCommand(
        admin.id,
        user.id,
        user.name,
        user.phone.value,
      ),
    );
  });

  it('takes the update actor only from the authenticated context', async () => {
    const { controller, commandBus, user, admin } = setup();
    commandBus.execute.mockResolvedValue({ user, changedFields: ['name'] });
    const body = {
      name: user.name,
      adminId: generateUuid(),
      actorId: generateUuid(),
    };
    await controller.updateUser(admin, user.id, body);
    const command = commandBus.execute.mock
      .calls[0][0] as UserUpdateAdminCommand;
    expect(command.adminId).toBe(admin.id);
    expect(command.adminId).not.toBe(body.adminId);
  });

  it('passes the authenticated admin to unlock commands', async () => {
    const { controller, commandBus, user, admin } = setup();
    commandBus.execute.mockResolvedValue(user);
    await controller.unlockUser(admin, user.id);
    expect(commandBus.execute).toHaveBeenCalledWith(
      new UserUnlockCommand(admin.id, user.id),
    );
  });
});
