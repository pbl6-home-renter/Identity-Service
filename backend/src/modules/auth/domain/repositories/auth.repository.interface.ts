import { RefreshTokenEntity } from '../../infra/persistence/refresh-token.entity';

export interface IAuthRepository {
  saveRefreshToken(token: RefreshTokenEntity): Promise<void>;
}
