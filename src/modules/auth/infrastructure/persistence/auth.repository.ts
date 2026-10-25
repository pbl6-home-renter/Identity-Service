import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  IAuthRepository,
  RefreshTokenRotation,
} from '../../domain/repositories/auth.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenMapper } from './mappers/refresh-token.mapper';
import { RefreshTokenEntity } from './refresh-token.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PasswordResetTokenEntity } from './password-reset-token.typeorm-entity';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';
import { PasswordResetTokenUsedException } from '../../domain/exceptions/password-reset-token-used.exception';
import { PasswordResetTokenMapper } from './mappers/password-reset-token.mapper';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
  ) {}

  async saveRefreshToken(token: RefreshToken): Promise<void> {
    await this.refreshTokenRepository.save(
      RefreshTokenMapper.toPersistence(token),
    );
  }

  async rotateRefreshToken(
    tokenHash: string,
    successorHash: string,
    now: Date,
  ): Promise<RefreshTokenRotation> {
    return this.refreshTokenRepository.manager.transaction(async (manager) => {
      // Row lock serialises concurrent refreshes of the same token.
      const raw = await manager.findOne(RefreshTokenEntity, {
        where: { tokenHash, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!raw) {
        return { outcome: 'invalid' };
      }

      const current = RefreshTokenMapper.toDomain(raw);
      if (current.revokedAt !== null) {
        await this.revokeFamily(manager, current.familyId, now);
        return { outcome: 'reused' };
      }
      if (!current.isUsable(now)) {
        return { outcome: 'invalid' };
      }

      const userExists = await manager.exists(UserEntity, {
        where: { id: current.userId, isDeleted: false },
      });
      if (!userExists) {
        return { outcome: 'invalid' };
      }

      await manager.update(RefreshTokenEntity, current.id, { revokedAt: now });
      await manager.save(
        RefreshTokenMapper.toPersistence(current.rotate(successorHash, now)),
      );
      return { outcome: 'rotated', userId: current.userId };
    });
  }

  async revokeRefreshTokenFamily(
    tokenHash: string,
    userId: Uuid,
  ): Promise<void> {
    const raw = await this.refreshTokenRepository.findOne({
      where: { tokenHash, userId, isDeleted: false },
    });

    if (raw) {
      await this.revokeFamily(
        this.refreshTokenRepository.manager,
        raw.familyId,
        new Date(),
      );
    }
  }

  private async revokeFamily(
    manager: EntityManager,
    familyId: Uuid,
    now: Date,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt: now })
      .where('family_id = :familyId', { familyId })
      .andWhere('revoked_at IS NULL')
      .execute();
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

        PasswordResetTokenMapper.toDomain(resetToken).assertUsable(new Date());

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
