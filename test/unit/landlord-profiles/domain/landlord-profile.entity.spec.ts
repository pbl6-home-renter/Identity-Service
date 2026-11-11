import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { InvalidPayoutAccountException } from 'modules/landlord-profiles/domain/exceptions/invalid-payout-account.exception';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('PayoutAccount', () => {
  it('normalizes whitespace and compares all account identity fields', () => {
    const payout = PayoutAccount.create({
      bankCode: '  VCB1 ',
      accountNumber: ' 0123456789 ',
      accountName: ' Tenant One ',
    });

    expect(payout.bankCode).toBe('VCB1');
    expect(payout.accountNumber).toBe('0123456789');
    expect(payout.accountName).toBe('Tenant One');
    expect(
      payout.equals(
        PayoutAccount.create({
          bankCode: 'VCB1',
          accountNumber: '0123456789',
          accountName: 'Tenant One',
        }),
      ),
    ).toBe(true);
  });

  it('rejects non-numeric or out-of-range account numbers', () => {
    expect(() =>
      PayoutAccount.create({
        bankCode: 'VCB',
        accountNumber: '12345',
        accountName: 'Tenant One',
      }),
    ).toThrow(InvalidPayoutAccountException);
  });
});

describe('LandlordProfile', () => {
  it('emits an event when a payout account changes but not when it stays equal', () => {
    const userId = generateUuid();
    const payoutAccount = PayoutAccount.create({
      bankCode: 'VCB1',
      accountNumber: '0123456789',
      accountName: 'Tenant One',
    });
    const created = LandlordProfile.withPayoutAccount(
      null,
      userId,
      payoutAccount,
    );
    const unchanged = LandlordProfile.withPayoutAccount(
      created,
      userId,
      PayoutAccount.create({
        bankCode: 'VCB1',
        accountNumber: '0123456789',
        accountName: 'Tenant One',
      }),
    );
    const cleared = LandlordProfile.withPayoutAccount(created, userId, null);

    expect(created.pullDomainEvents()).toHaveLength(1);
    expect(unchanged.pullDomainEvents()).toHaveLength(0);
    expect(cleared.payoutAccount).toBeNull();
    expect(cleared.pullDomainEvents()).toHaveLength(1);
  });
});
