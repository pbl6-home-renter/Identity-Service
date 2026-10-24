export interface PasswordResetTokenGenerated {
  rawPasswordResetToken: string;
  passwordResetTokenHash: string;
  expiresAt: Date;
}
