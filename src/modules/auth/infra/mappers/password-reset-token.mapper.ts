import { PasswordResetToken } from '../../domain/entities/password-reset-token';
import { PasswordResetTokenEntity } from '../persistence/password-reset-token.entity';

export class PasswordResetTokenMapper {
  static toDomain(raw: PasswordResetTokenEntity): PasswordResetToken {
    return PasswordResetToken.create({
      id: raw.id,
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: PasswordResetToken): PasswordResetTokenEntity {
    const raw = new PasswordResetTokenEntity();
    raw.id = domain.id;
    raw.userId = domain.userId;
    raw.tokenHash = domain.tokenHash;
    raw.expiresAt = domain.expiresAt;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
