import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { UserProps } from './user.props';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { UserLockAlreadyLockedException } from '../exceptions/user-lock-already-locked.exception';
import { UserUnlockNotLockedException } from '../exceptions/user-unlock-not-locked.exception';
import { UserDeleteAlreadyDeletedException } from '../exceptions/user-delete-already-deleted.exception';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserLockedEvent } from '../events/user-locked.event';
import { UserUnlockedEvent } from '../events/user-unlocked.event';
import { UserAccountNotificationRequestedEvent } from '../events/user-account-notification-requested.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { UserLockPendingVerificationException } from '../exceptions/user-lock-pending-verification.exception';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';
import { UserEmailVerificationNotPendingException } from '../exceptions/user-email-verification-not-pending.exception';

export class User extends AggregateRoot {
  private constructor(
    readonly phone: Phone,
    readonly email: Email,
    readonly password: string,
    readonly name: string,
    readonly role: UserRole,
    private _status: UserStatus,
    private _lockReason: string | null,
    private _lockedAt: Date | null,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  get status(): UserStatus {
    return this._status;
  }

  get lockReason(): string | null {
    return this._lockReason;
  }

  get lockedAt(): Date | null {
    return this._lockedAt;
  }

  lock(reason: string): void {
    if (this._status === UserStatus.LOCKED) {
      throw new UserLockAlreadyLockedException();
    }
    if (this._status === UserStatus.PENDING_VERIFICATION) {
      throw new UserLockPendingVerificationException();
    }
    this._status = UserStatus.LOCKED;
    this._lockReason = reason;
    const lockedAt = new Date();
    this._lockedAt = lockedAt;
    this.addDomainEvent(
      new UserLockedEvent(this.id, this.role, this._status, reason, lockedAt),
    );
    this.addDomainEvent(
      new UserAccountNotificationRequestedEvent(
        this.id,
        this._status,
        lockedAt,
      ),
    );
  }

  unlock(): void {
    if (this._status !== UserStatus.LOCKED) {
      throw new UserUnlockNotLockedException();
    }
    this._status = UserStatus.ACTIVE;
    this._lockReason = null;
    this._lockedAt = null;
    this.addDomainEvent(
      new UserUnlockedEvent(this.id, this._status, this.role, this.phone.value),
    );
    this.addDomainEvent(
      new UserAccountNotificationRequestedEvent(this.id, this._status, null),
    );
  }

  verifyEmail(): void {
    if (this._status !== UserStatus.PENDING_VERIFICATION) {
      throw new UserEmailVerificationNotPendingException();
    }
    this._status = UserStatus.ACTIVE;
    this.addDomainEvent(
      new UserEmailVerifiedEvent(
        this.id,
        this.phone.value,
        this.role,
        this._status,
      ),
    );
  }

  delete(): void {
    if (this.isDeleted) {
      throw new UserDeleteAlreadyDeletedException();
    }
    this.markAsDeleted();
    this.addDomainEvent(new UserDeletedEvent(this.id, this.role));
  }

  updateProfile(props: { name?: string; phone?: Phone }): User {
    const updated = User.reconstitute({
      id: this.id,
      phone: props.phone ?? this.phone,
      email: this.email,
      password: this.password,
      name: props.name ?? this.name,
      role: this.role,
      status: this.status,
      lockReason: this.lockReason,
      lockedAt: this.lockedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      isDeleted: this.isDeleted,
    });

    if (updated.name !== this.name || !updated.phone.equals(this.phone)) {
      updated.addDomainEvent(
        new UserUpdatedEvent(
          updated.id,
          updated.name,
          updated.phone.value,
          updated.role,
          updated.status,
        ),
      );
    }
    return updated;
  }

  static register(props: UserProps): User {
    const user = User.reconstitute(props);

    user.addDomainEvent(
      new UserRegisteredEvent(
        user.id,
        user.name,
        user.email.value,
        user.phone.value,
        user.role,
        user.status,
      ),
    );

    return user;
  }

  static create(props: UserProps): User {
    return User.reconstitute(props);
  }

  static reconstitute(props: UserProps): User {
    return new User(
      props.phone,
      props.email,
      props.password,
      props.name,
      props.role,
      props.status,
      props.lockReason ?? null,
      props.lockedAt ?? null,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
