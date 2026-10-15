export interface PasswordResetTokenGenerated {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}
