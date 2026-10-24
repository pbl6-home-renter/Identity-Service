import { RefreshToken } from '../../domain/entities/refresh-token';
import { RefreshTokenEntity } from '../persistence/refresh-token.entity';

export class RefreshTokenMapper {
  static toDomain(refreshToken: RefreshTokenEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: refreshToken.id,
      userId: refreshToken.userId,
      familyId: refreshToken.familyId,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      revokedAt: refreshToken.revokedAt ?? null,
      createdAt: refreshToken.createdAt,
      updatedAt: refreshToken.updatedAt,
      isDeleted: refreshToken.isDeleted,
    });
  }

  static toPersistence(domain: RefreshToken): RefreshTokenEntity {
    const raw = new RefreshTokenEntity();
    raw.id = domain.id;
    raw.userId = domain.userId;
    raw.familyId = domain.familyId;
    raw.tokenHash = domain.tokenHash;
    raw.expiresAt = domain.expiresAt;
    raw.revokedAt = domain.revokedAt;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
