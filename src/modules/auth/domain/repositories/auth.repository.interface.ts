import { RefreshToken } from '../entities/refresh-token';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export type RefreshTokenRotation =
  | { outcome: 'rotated'; userId: Uuid }
  | { outcome: 'invalid' }
  | { outcome: 'reused' };

/**
 * Refresh-token store. Tokens are revoked, never deleted, so this is not a
 * `BaseRepository`.
 */
export interface IAuthRepository {
  saveRefreshToken(token: RefreshToken): Promise<void>;

  /**
   * Atomically revokes the active token matching `tokenHash` and stores its
   * successor. A token that was already revoked means reuse: the whole family
   * is revoked (and committed) before reporting it.
   */
  rotateRefreshToken(
    tokenHash: string,
    successorHash: string,
    now: Date,
  ): Promise<RefreshTokenRotation>;

  /** Revokes the family of `tokenHash` if it belongs to `userId`; no-op otherwise. */
  revokeRefreshTokenFamily(tokenHash: string, userId: Uuid): Promise<void>;

  revokeActiveRefreshTokensByUserId(userId: Uuid): Promise<void>;

  resetPasswordWithToken(
    tokenHash: string,
    passwordHash: string,
  ): Promise<void>;
}
