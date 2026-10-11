import { RefreshTokenEntity } from '../../infra/persistence/refresh-token.entity';

export interface AuthRepository {
  saveRefreshToken(token: RefreshTokenEntity): Promise<void>;
}
