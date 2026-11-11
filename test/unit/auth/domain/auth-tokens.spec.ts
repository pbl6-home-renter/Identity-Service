import { PasswordResetToken } from 'modules/auth/domain/entities/password-reset-token';
import { PasswordResetTokenExpiredException } from 'modules/auth/domain/exceptions/password-reset-token-expired.exception';
import { PasswordResetTokenUsedException } from 'modules/auth/domain/exceptions/password-reset-token-used.exception';
import { RefreshToken } from 'modules/auth/domain/entities/refresh-token';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('RefreshToken', () => {
  it('rotates within the same family and preserves the original session lifetime', () => {
    const userId = generateUuid();
    const familyId = generateUuid();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const expiresAt = new Date('2026-01-31T00:00:00.000Z');
    const token = RefreshToken.create({
      userId,
      familyId,
      tokenHash: 'old-hash',
      expiresAt,
      createdAt,
    });
    const rotatedAt = new Date('2026-01-10T00:00:00.000Z');

    const next = token.rotate('new-hash', rotatedAt);

    expect(next.familyId).toBe(familyId);
    expect(next.tokenHash).toBe('new-hash');
    expect(next.expiresAt).toEqual(
      new Date(
        rotatedAt.getTime() + (expiresAt.getTime() - createdAt.getTime()),
      ),
    );
    expect(token.isUsable(rotatedAt)).toBe(true);
  });
});

describe('PasswordResetToken', () => {
  it('is usable strictly before expiry and distinguishes used from expired tokens', () => {
    const expiresAt = new Date('2026-11-02T00:00:00.000Z');
    const token = PasswordResetToken.create({
      userId: generateUuid(),
      tokenHash: 'token-hash',
      expiresAt,
    });

    expect(token.isExpired(new Date(expiresAt.getTime() - 1))).toBe(false);
    expect(() => token.assertUsable(expiresAt)).toThrow(
      PasswordResetTokenExpiredException,
    );

    const used = PasswordResetToken.create({
      userId: generateUuid(),
      tokenHash: 'used-hash',
      expiresAt,
      isDeleted: true,
    });
    expect(() => used.assertUsable(new Date(expiresAt.getTime() + 1))).toThrow(
      PasswordResetTokenUsedException,
    );
  });
});
