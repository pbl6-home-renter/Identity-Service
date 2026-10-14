import { RefreshToken } from '../entities/refresh-token';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface IAuthRepository {
  saveRefreshToken(token: RefreshToken): Promise<void>;
  revokeActiveRefreshTokensByUserId(userId: Uuid): Promise<void>;
  savePasswordResetToken(
    userId: Uuid,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
}
