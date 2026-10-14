import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { JwtPayload } from 'shared/interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(userId: Uuid, role: UserRole): string {
    const payload: JwtPayload = { sub: userId, role };
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(rememberMe: boolean = true): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomUUID();
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expirationDays = rememberMe ? 7 : 1;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }

  generatePasswordResetToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }
}
