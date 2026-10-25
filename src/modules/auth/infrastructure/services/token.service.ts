import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { importPKCS8, SignJWT } from 'jose';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { JwtPayload } from 'shared/infrastructure/security/jwt-payload';
import { JwtConfigService } from '../config/jwt-config.service';
import type { PasswordResetTokenGenerated } from '../../application/ports/password-reset-token-generated.model';
import {
  GeneratedOpaqueRefreshToken,
  GeneratedRefreshToken,
  ITokenService,
} from '../../application/ports/token-service.port';

@Injectable()
export class TokenService implements ITokenService {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_BYTES = 32;
  private static readonly PASSWORD_RESET_TOKEN_BYTES = 32;
  private static readonly PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

  private readonly privateKey: ReturnType<typeof importPKCS8>;

  constructor(private readonly jwtConfig: JwtConfigService) {
    this.privateKey = importPKCS8(this.jwtConfig.privateKey, 'RS256');
  }

  async generateAccessToken(
    userId: Uuid,
    role: UserRole,
    status: UserStatus,
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, role, status };

    return new SignJWT(payload)
      .setProtectedHeader({
        alg: 'RS256',
        kid: this.jwtConfig.keyId,
      })
      .setIssuer(this.jwtConfig.issuer)
      .setAudience(this.jwtConfig.audience)
      .setIssuedAt()
      .setExpirationTime(TokenService.ACCESS_TOKEN_EXPIRES_IN)
      .sign(await this.privateKey);
  }

  generateRefreshToken(rememberMe: boolean = true): GeneratedRefreshToken {
    const { rawRefreshToken, refreshTokenHash } =
      this.generateOpaqueRefreshToken();

    const expirationDays = rememberMe ? 7 : 1;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return {
      rawRefreshToken,
      refreshTokenHash,
      expiresAt,
    };
  }

  generateOpaqueRefreshToken(): GeneratedOpaqueRefreshToken {
    const rawRefreshToken = randomBytes(
      TokenService.REFRESH_TOKEN_BYTES,
    ).toString('base64url');

    return {
      rawRefreshToken,
      refreshTokenHash: this.hashRefreshToken(rawRefreshToken),
    };
  }

  hashRefreshToken(rawRefreshToken: string): string {
    return createHash('sha256').update(rawRefreshToken).digest('hex');
  }

  generatePasswordResetToken(): PasswordResetTokenGenerated {
    const rawPasswordResetToken = randomBytes(
      TokenService.PASSWORD_RESET_TOKEN_BYTES,
    ).toString('base64url');

    const passwordResetTokenHash = this.hashPasswordResetToken(
      rawPasswordResetToken,
    );

    const expiresAt = new Date(
      Date.now() + TokenService.PASSWORD_RESET_TOKEN_TTL_MS,
    );

    return {
      rawPasswordResetToken,
      passwordResetTokenHash,
      expiresAt,
    };
  }

  hashPasswordResetToken(rawPasswordResetToken: string): string {
    return createHash('sha256').update(rawPasswordResetToken).digest('hex');
  }
}
