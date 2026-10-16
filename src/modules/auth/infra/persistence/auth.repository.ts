import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper';
import { RefreshTokenEntity } from './refresh-token.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { UserEntity } from '../../../users/infra/persistence/user.entity';
import { PasswordResetTokenUsedException } from '../../domain/exceptions/password-reset-token-used.exception';
import { PasswordResetTokenExpiredException } from '../../domain/exceptions/password-reset-token-expired.exception';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
  ) {}

  async saveRefreshToken(token: RefreshToken): Promise<void> {
    const raw = RefreshTokenMapper.toPersistence(token);
    await this.refreshTokenRepository.save(raw);
  }

  async revokeActiveRefreshTokensByUserId(userId: Uuid): Promise<void> {
    await this.revokeActiveRefreshTokens(
      this.refreshTokenRepository.manager,
      userId,
    );
  }

  private async revokeActiveRefreshTokens(
    manager: EntityManager,
    userId: Uuid,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > NOW()')
      .execute();
  }

  async resetPasswordWithToken(
    tokenHash: string,
    passwordHash: string,
  ): Promise<void> {
    await this.passwordResetTokenRepository.manager.transaction(
      async (manager) => {
        const resetToken = await manager.findOne(PasswordResetTokenEntity, {
          where: { tokenHash, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });
        if (!resetToken) {
          throw new PasswordResetTokenUsedException();
        }

        if (resetToken.expiresAt.getTime() <= Date.now()) {
          throw new PasswordResetTokenExpiredException();
        }

        const user = await manager.findOne(UserEntity, {
          where: { id: resetToken.userId, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) {
          throw new PasswordResetTokenUsedException();
        }

        await manager.update(UserEntity, user.id, { password: passwordHash });
        await this.revokeActiveRefreshTokens(manager, user.id);
        await manager.delete(PasswordResetTokenEntity, { id: resetToken.id });
      },
    );
  }
}
