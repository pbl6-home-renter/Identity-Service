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
    this._status = UserStatus.LOCKED;
    this._lockReason = reason;
    this._lockedAt = new Date();
  }

  unlock(): void {
    if (this._status !== UserStatus.LOCKED) {
      throw new UserUnlockNotLockedException();
    }
    this._status = UserStatus.ACTIVE;
    this._lockReason = null;
    this._lockedAt = null;
  }

  updateProfile(props: { name?: string; phone?: Phone }): User {
    return User.reconstitute({
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
