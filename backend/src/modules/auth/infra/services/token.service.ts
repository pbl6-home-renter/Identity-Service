import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { ApiConfigService } from 'shared/services/api-config.service';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from '../../../users/domain/enums/user-role.enum';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  generateAccessToken(userId: Uuid, role: UserRole): string {
    return this.jwtService.sign(
      { sub: userId, role },
      {
        secret: this.apiConfigService.jwtSecret,
        expiresIn: '15m',
      },
    );
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
}
