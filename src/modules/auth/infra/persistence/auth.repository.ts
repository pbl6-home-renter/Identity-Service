import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper';
import { RefreshTokenEntity } from './refresh-token.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { UserEntity } from '../../../users/infra/persistence/user.entity';
import { InvalidResetTokenException } from '../../domain/exceptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '../../domain/exceptions/reset-token-expired.exception';

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
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > NOW()')
      .execute();
  }

  async savePasswordResetToken(
    userId: Uuid,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.passwordResetTokenRepository.manager.transaction(
      async (manager) => {
        await manager.delete(PasswordResetTokenEntity, { userId });
        const token = manager.create(PasswordResetTokenEntity, {
          userId,
          tokenHash,
          expiresAt,
        });
        await manager.save(token);
      },
    );
  }

  async resetPasswordWithToken(
    tokenHash: string,
    passwordHash: string,
  ): Promise<void> {
    await this.passwordResetTokenRepository.manager.transaction(
      async (manager) => {
        const resetToken = await manager.findOne(PasswordResetTokenEntity, {
          where: { tokenHash },
          lock: { mode: 'pessimistic_write' },
        });
        if (!resetToken) {
          throw new InvalidResetTokenException();
        }

        if (resetToken.expiresAt.getTime() <= Date.now()) {
          throw new ResetTokenExpiredException();
        }

        const user = await manager.findOne(UserEntity, {
          where: { id: resetToken.userId, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) {
          throw new InvalidResetTokenException();
        }

        await manager.update(UserEntity, user.id, { password: passwordHash });
        await manager
          .createQueryBuilder()
          .update(RefreshTokenEntity)
          .set({ revokedAt: new Date() })
          .where('user_id = :userId', { userId: user.id })
          .andWhere('revoked_at IS NULL')
          .execute();
        await manager.delete(PasswordResetTokenEntity, { id: resetToken.id });
      },
    );
  }
}
