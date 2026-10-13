import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenEntity } from '../persistence/refresh-token.entity';

export class RefreshTokenMapper {
  static toDomain(raw: RefreshTokenEntity): RefreshToken {
    return RefreshToken.create({
      id: raw.id,
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: RefreshToken): RefreshTokenEntity {
    const raw = new RefreshTokenEntity();
    raw.id = domain.id;
    raw.userId = domain.userId;
    raw.tokenHash = domain.tokenHash;
    raw.expiresAt = domain.expiresAt;
    raw.revokedAt = domain.revokedAt;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
