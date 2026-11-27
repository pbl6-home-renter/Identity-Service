import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid, generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { MODERATION_RULES } from '../constants/moderation-rules.constant';
import { AccountAppealStatus } from '../enums/account-appeal-status.enum';
import { AccountAppealRejectedNotificationEvent } from '../events/account-appeal-rejected-notification.event';
import { AppealAlreadyPendingException } from '../exceptions/appeal-already-pending.exception';
import { AppealCooldownException } from '../exceptions/appeal-cooldown.exception';
import { AppealNotPendingException } from '../exceptions/appeal-not-pending.exception';
import {
  AccountAppealProps,
  AccountAppealSubmitInput,
} from './account-appeal.props';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A locked user's request to be unlocked (P13-D109). */
export class AccountAppeal extends AggregateRoot {
  private constructor(private readonly props: AccountAppealProps) {
    super(props.id, props.createdAt, props.updatedAt);
  }

  get userId(): Uuid {
    return this.props.userId;
  }
  get lockedAt(): Date {
    return this.props.lockedAt;
  }
  get lockReason(): string | null {
    return this.props.lockReason;
  }
  get content(): string {
    return this.props.content;
  }
  get attachmentMediaIds(): Uuid[] {
    return [...this.props.attachmentMediaIds];
  }
  get contactEmail(): string | null {
    return this.props.contactEmail;
  }
  get contactPhone(): string | null {
    return this.props.contactPhone;
  }
  get status(): AccountAppealStatus {
    return this.props.status;
  }
  get rejectReason(): string | null {
    return this.props.rejectReason;
  }
  get reviewedBy(): Uuid | null {
    return this.props.reviewedBy;
  }
  get reviewedAt(): Date | null {
    return this.props.reviewedAt;
  }
  get isPending(): boolean {
    return this.props.status === AccountAppealStatus.PENDING;
  }

  /**
   * When the user may appeal again, given their latest appeal of the current
   * lock period. `null` means "now".
   */
  static nextSubmitAt(latest: AccountAppeal | null): Date | null {
    if (!latest || latest.status !== AccountAppealStatus.REJECTED) {
      return null;
    }
    const reviewedAt = latest.reviewedAt ?? latest.createdAt;
    return new Date(
      reviewedAt.getTime() +
        MODERATION_RULES.APPEAL_RESUBMIT_COOLDOWN_DAYS * DAY_MS,
    );
  }

  static assertCanSubmit(latest: AccountAppeal | null, now = new Date()): void {
    if (latest?.isPending) {
      throw new AppealAlreadyPendingException();
    }
    const nextSubmitAt = AccountAppeal.nextSubmitAt(latest);
    if (nextSubmitAt && now.getTime() < nextSubmitAt.getTime()) {
      throw new AppealCooldownException(nextSubmitAt);
    }
  }

  static submit(
    input: AccountAppealSubmitInput,
    latest: AccountAppeal | null,
    now = new Date(),
  ): AccountAppeal {
    AccountAppeal.assertCanSubmit(latest, now);
    return new AccountAppeal({
      ...input,
      attachmentMediaIds: [...new Set(input.attachmentMediaIds)],
      id: generateUuid(),
      status: AccountAppealStatus.PENDING,
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AccountAppealProps): AccountAppeal {
    return new AccountAppeal(props);
  }

  accept(adminId: Uuid, now = new Date()): void {
    this.assertPending();
    this.props.status = AccountAppealStatus.ACCEPTED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = now;
    this.props.updatedAt = now;
  }

  reject(adminId: Uuid, reason: string, now = new Date()): void {
    this.assertPending();
    this.props.status = AccountAppealStatus.REJECTED;
    this.props.rejectReason = reason;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = now;
    this.props.updatedAt = now;
    this.addDomainEvent(
      new AccountAppealRejectedNotificationEvent(
        this.id,
        this.props.userId,
        reason,
        AccountAppeal.nextSubmitAt(this)!,
      ),
    );
  }

  toProps(): AccountAppealProps {
    return { ...this.props, attachmentMediaIds: this.attachmentMediaIds };
  }

  private assertPending(): void {
    if (!this.isPending) {
      throw new AppealNotPendingException();
    }
  }
}
