import { RefreshTokenEntity } from '../../infra/persistence/refresh-token.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface IAuthRepository {
  saveRefreshToken(token: RefreshTokenEntity): Promise<void>;
  revokeActiveRefreshTokensByUserId(userId: Uuid): Promise<void>;
}
