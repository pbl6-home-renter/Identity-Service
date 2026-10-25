import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { PasswordResetToken } from '../entities/password-reset-token';

/** `save` replaces any earlier token of the same user. */
export interface IPasswordResetTokenRepository extends BaseRepository<PasswordResetToken> {}
