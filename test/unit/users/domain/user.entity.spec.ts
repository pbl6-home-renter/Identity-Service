import { USER_EVENTS } from 'modules/users/domain/constants/user-event.constants';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { InvalidEmailException } from 'modules/users/domain/exceptions/invalid-email.exception';
import { InvalidPhoneException } from 'modules/users/domain/exceptions/invalid-phone.exception';
import { UserDeleteAlreadyDeletedException } from 'modules/users/domain/exceptions/user-delete-already-deleted.exception';
import { UserEmailVerificationNotPendingException } from 'modules/users/domain/exceptions/user-email-verification-not-pending.exception';
import { UserLockAlreadyLockedException } from 'modules/users/domain/exceptions/user-lock-already-locked.exception';
import { UserLockPendingVerificationException } from 'modules/users/domain/exceptions/user-lock-pending-verification.exception';
import { UserUnlockNotLockedException } from 'modules/users/domain/exceptions/user-unlock-not-locked.exception';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createUser(status = UserStatus.ACTIVE): User {
  return User.create({
    id: generateUuid(),
    name: 'Tenant One',
    email: Email.create('tenant@example.com'),
    phone: Phone.create('0912345678'),
    password: 'hashed-password',
    role: UserRole.TENANT,
    status,
  });
}

describe('Email', () => {
  it('normalizes whitespace and casing before equality checks', () => {
    const email = Email.create('  TENANT@Example.COM ');

    expect(email.value).toBe('tenant@example.com');
    expect(email.equals(Email.create('tenant@example.com'))).toBe(true);
  });

  it('rejects malformed and overlong addresses', () => {
    expect(() => Email.create('tenant.example.com')).toThrow(
      InvalidEmailException,
    );
    expect(() => Email.create(`${'a'.repeat(250)}@example.com`)).toThrow(
      InvalidEmailException,
    );
  });
});

describe('Phone', () => {
  it('normalizes the international Vietnam prefix', () => {
    expect(Phone.create('+84912345678').value).toBe('0912345678');
  });

  it('rejects numbers outside the supported Vietnam formats', () => {
    expect(Phone.isValid('0912345678')).toBe(true);
    expect(Phone.isValid('+84912345678')).toBe(true);
    expect(() => Phone.create('+1 555 123 4567')).toThrow(
      InvalidPhoneException,
    );
  });
});

describe('User', () => {
  it('emits a registration event carrying the initial identity and status', () => {
    const user = User.register({
      name: 'Tenant One',
      email: Email.create('tenant@example.com'),
      phone: Phone.create('0912345678'),
      password: 'hashed-password',
      role: UserRole.TENANT,
      status: UserStatus.PENDING_VERIFICATION,
    });

    expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
    expect(user.pullDomainEvents()).toEqual([
      expect.objectContaining({
        eventType: USER_EVENTS.REGISTERED,
        name: 'Tenant One',
        email: 'tenant@example.com',
        status: UserStatus.PENDING_VERIFICATION,
      }),
    ]);
  });

  it('requires email verification before locking a pending account', () => {
    const user = createUser(UserStatus.PENDING_VERIFICATION);

    expect(() => user.lock('policy violation')).toThrow(
      UserLockPendingVerificationException,
    );
  });

  it('transitions a pending user through verification, lock, and unlock', () => {
    const user = createUser(UserStatus.PENDING_VERIFICATION);

    user.verifyEmail();
    expect(user.status).toBe(UserStatus.ACTIVE);
    user.lock('policy violation');
    expect(user.status).toBe(UserStatus.LOCKED);
    expect(user.lockReason).toBe('policy violation');
    user.unlock();

    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.lockReason).toBeNull();
    expect(user.lockedAt).toBeNull();
    const events = user.pullDomainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      USER_EVENTS.EMAIL_VERIFIED,
      USER_EVENTS.LOCKED,
      'notification.requested',
      USER_EVENTS.UNLOCKED,
      'notification.requested',
    ]);
    expect(events[2].payload).toEqual(
      expect.objectContaining({
        notification: expect.objectContaining({
          type: 'system',
          title: 'USER_ACCOUNT_LOCKED_TITLE',
          body: 'USER_ACCOUNT_LOCKED_BODY',
        }),
      }),
    );
  });

  it('keeps tenant lookup metadata on unlock and excludes it from the account notice', () => {
    const user = createUser(UserStatus.LOCKED);
    user.unlock();
    const [unlocked, notice] = user.pullDomainEvents();
    expect(unlocked.payload).toEqual({
      userId: user.id,
      status: UserStatus.ACTIVE,
      role: UserRole.TENANT,
      phone: '0912345678',
    });
    expect(notice.payload).toEqual(
      expect.objectContaining({
        sourceService: 'identity',
        recipientUserIds: [user.id],
        notification: expect.objectContaining({
          type: 'system',
          title: 'USER_ACCOUNT_UNLOCKED_TITLE',
          body: 'USER_ACCOUNT_UNLOCKED_BODY',
        }),
      }),
    );
    expect(JSON.stringify(notice.payload)).not.toContain('0912345678');
  });

  it('rejects repeated or out-of-order lifecycle transitions', () => {
    const user = createUser();
    expect(() => user.unlock()).toThrow(UserUnlockNotLockedException);
    expect(() => user.verifyEmail()).toThrow(
      UserEmailVerificationNotPendingException,
    );

    user.lock('review');
    expect(() => user.lock('again')).toThrow(UserLockAlreadyLockedException);
  });

  it('returns an updated aggregate and emits an event only when profile data changes', () => {
    const user = createUser();
    const unchanged = user.updateProfile({});
    const updated = user.updateProfile({ name: 'Updated Name' });

    expect(unchanged.pullDomainEvents()).toHaveLength(0);
    expect(updated.name).toBe('Updated Name');
    expect(updated.pullDomainEvents()).toEqual([
      expect.objectContaining({ eventType: USER_EVENTS.UPDATED }),
    ]);
  });

  it('rejects deletion after the aggregate was already deleted', () => {
    const user = User.reconstitute({
      phone: Phone.create('0912345678'),
      email: Email.create('tenant@example.com'),
      password: 'hashed-password',
      name: 'Tenant One',
      role: UserRole.TENANT,
      status: UserStatus.ACTIVE,
      isDeleted: true,
    });

    expect(() => user.delete()).toThrow(UserDeleteAlreadyDeletedException);
  });
});
