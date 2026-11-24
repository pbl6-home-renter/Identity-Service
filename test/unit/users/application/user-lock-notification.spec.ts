import { UserLockCommand } from 'modules/users/application/commands/user-lock/user-lock.command';
import { UserLockCommandHandler } from 'modules/users/application/commands/user-lock/user-lock.command.handler';
import { User } from 'modules/users/domain/entities/user';
import { UserLockCannotSelfException } from 'modules/users/domain/exceptions/user-lock-cannot-self.exception';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function setup() {
  const user = User.create({
    name: 'Tenant One',
    phone: Phone.create('0901234567'),
    email: Email.create('tenant@example.com'),
    password: 'hashed-password',
    role: UserRole.TENANT,
    status: UserStatus.ACTIVE,
  });
  const context: TransactionContext = { kind: 'transaction' };
  const repository = {
    findByIdForUpdate: jest.fn(async () => user),
    save: jest.fn(async () => undefined),
    recordLockPeriod: jest.fn(async () => undefined),
  };
  const unitOfWork = {
    run: jest.fn(
      async <T>(work: (transaction: TransactionContext) => Promise<T>) =>
        work(context),
    ),
  };
  const outbox = { append: jest.fn(async () => undefined) };
  const handler = new UserLockCommandHandler(
    repository as unknown as IUserRepository,
    unitOfWork as IUnitOfWork,
    outbox as unknown as OutboxRepository,
  );
  return { user, context, repository, unitOfWork, outbox, handler };
}

describe('UserLockCommandHandler notification', () => {
  it('writes the account notice to the outbox in the lock transaction', async () => {
    const { user, context, repository, outbox, handler } = setup();
    await handler.execute(
      new UserLockCommand(generateUuid(), user.id, 'policy violation'),
    );

    expect(repository.save).toHaveBeenCalledWith(user, context);
    expect(outbox.append).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          routingKey: 'notification.requested',
          payload: expect.objectContaining({
            recipientUserIds: [user.id],
            notification: expect.objectContaining({
              data: expect.objectContaining({ messageKey: 'user.locked' }),
            }),
          }),
        }),
      ]),
      context,
    );
  });

  it('rejects self-lock before starting a transaction or sending a notice', async () => {
    const { user, unitOfWork, outbox, handler } = setup();
    await expect(
      handler.execute(
        new UserLockCommand(user.id, user.id, 'policy violation'),
      ),
    ).rejects.toThrow(UserLockCannotSelfException);

    expect(unitOfWork.run).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });
});
