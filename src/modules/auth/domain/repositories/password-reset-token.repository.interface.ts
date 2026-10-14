import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { PasswordResetToken } from '../entities/password-reset-token';

export interface IPasswordResetTokenRepository extends BaseRepository<PasswordResetToken> {}
