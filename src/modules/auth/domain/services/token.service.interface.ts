import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PasswordResetTokenGenerated } from '../models/password-reset-token-generated.model';

export type GeneratedRefreshToken = {
  rawRefreshToken: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

export type GeneratedOpaqueRefreshToken = {
  rawRefreshToken: string;
  refreshTokenHash: string;
};

export interface ITokenService {
  generateAccessToken(
    userId: Uuid,
    role: UserRole,
    status: UserStatus,
  ): Promise<string>;

  generateRefreshToken(rememberMe?: boolean): GeneratedRefreshToken;

  generateOpaqueRefreshToken(): GeneratedOpaqueRefreshToken;

  hashRefreshToken(rawRefreshToken: string): string;

  generatePasswordResetToken(): PasswordResetTokenGenerated;

  hashPasswordResetToken(rawPasswordResetToken: string): string;
}
