import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface PasswordResetTokenProps {
  id?: Uuid;
  userId: Uuid;
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
