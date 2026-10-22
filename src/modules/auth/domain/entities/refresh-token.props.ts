import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface RefreshTokenProps {
  id?: Uuid;
  userId: Uuid;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
