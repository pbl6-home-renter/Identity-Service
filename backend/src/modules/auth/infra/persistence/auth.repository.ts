import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { RefreshTokenEntity } from './refresh-token.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  async saveRefreshToken(token: RefreshTokenEntity): Promise<void> {
    await this.refreshTokenRepository.save(token);
  }

  async revokeActiveRefreshTokensByUserId(userId: Uuid): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > NOW()')
      .execute();
  }
}
