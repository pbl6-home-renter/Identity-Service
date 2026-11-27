import { AppealAcceptCommand } from 'modules/moderation/application/commands/appeal-accept/appeal-accept.command';
import { AppealAcceptCommandHandler } from 'modules/moderation/application/commands/appeal-accept/appeal-accept.command.handler';
import { AppealRejectCommand } from 'modules/moderation/application/commands/appeal-reject/appeal-reject.command';
import { AppealRejectCommandHandler } from 'modules/moderation/application/commands/appeal-reject/appeal-reject.command.handler';
import { ModerationEmailComposerPort } from 'modules/moderation/application/ports/moderation-email-composer.port';
import { AccountAppeal } from 'modules/moderation/domain/entities/account-appeal';
import { AccountAppealStatus } from 'modules/moderation/domain/enums/account-appeal-status.enum';
import { IAccountAppealRepository } from 'modules/moderation/domain/repositories/account-appeal.repository.interface';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { User } from 'modules/users/domain/entities/user';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function setup() {
  const lockedAt = new Date('2026-11-20T00:00:00Z');
  const user = User.create({
    name: 'Tenant One',
    phone: Phone.create('0901234567'),
    email: Email.create('tenant@example.com'),
    password: 'hashed-password',
    role: UserRole.TENANT,
    status: UserStatus.LOCKED,
    lockReason: 'Spam',
    lockedAt,
  });
  const appeal = AccountAppeal.submit(
    {
      userId: user.id,
      lockedAt,
      lockReason: 'Spam',
      content: 'Tôi bị khóa nhầm, xin xem lại.',
      attachmentMediaIds: [],
      contactEmail: null,
      contactPhone: null,
    },
    null,
  );
  const context: TransactionContext = { kind: 'transaction' };
  const appealRepository = {
    findByIdForUpdate: jest.fn(async () => appeal),
    save: jest.fn(async () => undefined),
  };
  const userRepository = {
    findById: jest.fn(async () => user),
    findByIdForUpdate: jest.fn(async () => user),
    save: jest.fn(async () => undefined),
    recordUnlockPeriod: jest.fn(async () => undefined),
  };
  const unitOfWork = {
    run: jest.fn(
      async <T>(work: (transaction: TransactionContext) => Promise<T>) =>
        work(context),
    ),
  };
  const outbox = { append: jest.fn(async () => undefined) };
  const emailComposer: ModerationEmailComposerPort = {
    appealAccepted: () => ({ subject: 's', text: 't', html: 'h' }),
    appealRejected: () => ({ subject: 's', text: 't', html: 'h' }),
  };
  const deps = [
    appealRepository as unknown as IAccountAppealRepository,
    userRepository as unknown as IUserRepository,
    unitOfWork as IUnitOfWork,
    outbox as unknown as OutboxRepository,
    emailComposer,
  ] as const;
  return { user, appeal, lockedAt, userRepository, outbox, deps };
}

function routingKeys(outbox: { append: jest.Mock }): string[] {
  const messages = outbox.append.mock.calls[0][0] as { routingKey: string }[];
  return messages.map((message) => message.routingKey);
}

describe('Appeal review handlers', () => {
  it('accepting unlocks the account, closes its lock period and queues the email', async () => {
    const { user, appeal, lockedAt, userRepository, outbox, deps } = setup();
    const result = await new AppealAcceptCommandHandler(...deps).execute(
      new AppealAcceptCommand(generateUuid(), appeal.id),
    );

    expect(result.unlocked).toBe(true);
    expect(appeal.status).toBe(AccountAppealStatus.ACCEPTED);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(userRepository.recordUnlockPeriod).toHaveBeenCalledWith(
      user.id,
      lockedAt,
      expect.any(Date),
      expect.anything(),
    );
    expect(routingKeys(outbox)).toEqual(
      expect.arrayContaining([
        'user.unlocked',
        'notification.requested',
        'email.send_requested',
      ]),
    );
  });

  it('accepting an appeal of an account already unlocked only closes it', async () => {
    const { user, appeal, userRepository, outbox, deps } = setup();
    user.unlock();
    user.pullDomainEvents();

    const result = await new AppealAcceptCommandHandler(...deps).execute(
      new AppealAcceptCommand(generateUuid(), appeal.id),
    );

    expect(result.unlocked).toBe(false);
    expect(appeal.status).toBe(AccountAppealStatus.ACCEPTED);
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('rejecting keeps the lock and queues the notice and the email', async () => {
    const { user, appeal, outbox, deps } = setup();
    await new AppealRejectCommandHandler(...deps).execute(
      new AppealRejectCommand(generateUuid(), appeal.id, 'Không đủ căn cứ'),
    );

    expect(appeal.status).toBe(AccountAppealStatus.REJECTED);
    expect(user.status).toBe(UserStatus.LOCKED);
    expect(routingKeys(outbox)).toEqual([
      'notification.requested',
      'email.send_requested',
    ]);
  });
});
