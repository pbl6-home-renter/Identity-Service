import { AccountAppeal } from 'modules/moderation/domain/entities/account-appeal';
import { AccountAppealStatus } from 'modules/moderation/domain/enums/account-appeal-status.enum';
import { AppealAlreadyPendingException } from 'modules/moderation/domain/exceptions/appeal-already-pending.exception';
import { AppealCooldownException } from 'modules/moderation/domain/exceptions/appeal-cooldown.exception';
import { AppealNotPendingException } from 'modules/moderation/domain/exceptions/appeal-not-pending.exception';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

const DAY_MS = 24 * 60 * 60 * 1000;

function submit(latest: AccountAppeal | null = null, now = new Date()) {
  return AccountAppeal.submit(
    {
      userId: generateUuid(),
      lockedAt: new Date('2026-11-20T00:00:00Z'),
      lockReason: 'Spam',
      content: 'Tôi bị khóa nhầm, xin xem lại.',
      attachmentMediaIds: [],
      contactEmail: null,
      contactPhone: null,
    },
    latest,
    now,
  );
}

describe('AccountAppeal', () => {
  it('starts pending', () => {
    const appeal = submit();
    expect(appeal.status).toBe(AccountAppealStatus.PENDING);
    expect(appeal.isPending).toBe(true);
  });

  it('allows only one pending appeal', () => {
    expect(() => submit(submit())).toThrow(AppealAlreadyPendingException);
  });

  it('enforces the 7-day wait after a rejection, then allows a new appeal', () => {
    const rejectedAt = new Date('2026-11-21T00:00:00Z');
    const rejected = submit();
    rejected.reject(generateUuid(), 'Không đủ căn cứ', rejectedAt);

    const nextSubmitAt = AccountAppeal.nextSubmitAt(rejected);
    expect(nextSubmitAt).toEqual(new Date(rejectedAt.getTime() + 7 * DAY_MS));
    expect(() =>
      submit(rejected, new Date(rejectedAt.getTime() + 6 * DAY_MS)),
    ).toThrow(AppealCooldownException);
    expect(
      submit(rejected, new Date(rejectedAt.getTime() + 7 * DAY_MS)).isPending,
    ).toBe(true);
  });

  it('has no wait after an accepted appeal', () => {
    const accepted = submit();
    accepted.accept(generateUuid());
    expect(AccountAppeal.nextSubmitAt(accepted)).toBeNull();
  });

  it('emits an appeal.rejected notification only on rejection', () => {
    const appeal = submit();
    appeal.reject(generateUuid(), 'Không đủ căn cứ');

    const [event] = appeal.pullDomainEvents();
    expect(event.routingKey).toBe('notification.requested');
    expect(event.payload).toEqual(
      expect.objectContaining({
        recipientUserIds: [appeal.userId],
        notification: expect.objectContaining({
          data: expect.objectContaining({
            messageKey: 'appeal.rejected',
            rejectReason: 'Không đủ căn cứ',
          }),
        }),
      }),
    );
  });

  it('cannot be reviewed twice', () => {
    const appeal = submit();
    appeal.accept(generateUuid());
    expect(() => appeal.reject(generateUuid(), 'x')).toThrow(
      AppealNotPendingException,
    );
  });
});
