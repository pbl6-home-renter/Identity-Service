import { EventBus } from '@nestjs/cqrs';
import { UserChangePasswordCommand } from 'modules/users/application/commands/user-change-password/user-change-password.command';
import { UserChangePasswordCommandHandler } from 'modules/users/application/commands/user-change-password/user-change-password.command.handler';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { UserChangePasswordInvalidCurrentException } from 'modules/users/domain/exceptions/user-change-password-invalid-current.exception';
import { UserChangePasswordMismatchException } from 'modules/users/domain/exceptions/user-change-password-mismatch.exception';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { User } from 'modules/users/domain/entities/user';
import { UserPasswordChangedEvent } from 'modules/users/domain/events/user-password-changed.event';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createUser() {
  return User.create({
    id: generateUuid(),
    name: 'Tenant One',
    email: Email.create('tenant@example.com'),
    phone: Phone.create('0912345678'),
    password: 'old-hash',
    role: UserRole.TENANT,
    status: UserStatus.ACTIVE,
  });
}

describe('UserChangePasswordCommandHandler', () => {
  it('verifies the current password, persists the new hash, then publishes the event', async () => {
    const user = createUser();
    const order: string[] = [];
    const repository = {
      findById: jest.fn(async () => user),
      updatePassword: jest.fn(async () => order.push('persisted')),
    } as unknown as IUserRepository;
    const passwordHasher: IPasswordHasher = {
      compare: jest.fn(async () => true),
      hash: jest.fn(async () => 'new-hash'),
    };
    const eventBus = {
      publish: jest.fn((event: unknown) => {
        expect(event).toBeInstanceOf(UserPasswordChangedEvent);
        order.push('published');
      }),
    } as unknown as EventBus;
    const handler = new UserChangePasswordCommandHandler(
      passwordHasher,
      repository,
      eventBus,
    );

    await handler.execute(
      UserChangePasswordCommand.create(user.id, {
        currentPassword: 'current-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    );

    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'current-password',
      'old-hash',
    );
    expect(repository.updatePassword).toHaveBeenCalledWith(user.id, 'new-hash');
    expect(order).toEqual(['persisted', 'published']);
  });

  it('rejects mismatched confirmation before reading or hashing credentials', async () => {
    const repository = { findById: jest.fn() } as unknown as IUserRepository;
    const passwordHasher: IPasswordHasher = {
      compare: jest.fn(),
      hash: jest.fn(),
    };
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const handler = new UserChangePasswordCommandHandler(
      passwordHasher,
      repository,
      eventBus,
    );

    await expect(
      handler.execute(
        UserChangePasswordCommand.create(generateUuid(), {
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 'different',
        }),
      ),
    ).rejects.toThrow(UserChangePasswordMismatchException);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it('does not persist or publish when the current password is incorrect', async () => {
    const user = createUser();
    const repository = {
      findById: jest.fn(async () => user),
      updatePassword: jest.fn(),
    } as unknown as IUserRepository;
    const passwordHasher: IPasswordHasher = {
      compare: jest.fn(async () => false),
      hash: jest.fn(),
    };
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const handler = new UserChangePasswordCommandHandler(
      passwordHasher,
      repository,
      eventBus,
    );

    await expect(
      handler.execute(
        UserChangePasswordCommand.create(user.id, {
          currentPassword: 'wrong',
          newPassword: 'new',
          confirmPassword: 'new',
        }),
      ),
    ).rejects.toThrow(UserChangePasswordInvalidCurrentException);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(repository.updatePassword).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
