import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { RegisterCommand } from '../implements/register.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { UserRepository } from '../../../../users/domain/repositories/user.repository';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { TokenService } from '../../../infra/services/token.service';
import { UserRole } from '../../../../users/domain/enums/user-role.enum';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum';
import { User } from '../../../../users/domain/entities/user';
import { RefreshTokenEntity } from '../../../infra/persistence/refresh-token.entity';
import { EmailAlreadyExistsException } from '../../../domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from '../../../domain/exceptions/phone-already-exists.exception';
import { RoleNotAllowedException } from '../../../domain/exceptions/role-not-allowed.exception';

@CommandHandler(RegisterCommand)
export class RegisterCommandHandler implements ICommandHandler<
  RegisterCommand,
  AuthResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResult> {
    const { name, email, phone, password, role } = command;

    if (role === UserRole.ADMIN || (role as string) === 'admin') {
      throw new RoleNotAllowedException(role);
    }

    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(email);
    }

    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new PhoneAlreadyExistsException(phone);
    }

    const hashedPassword = await BcryptUtils.hash(password);

    const user = User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
      lockReason: null,
      lockedAt: null,
    });

    await this.userRepository.save(user);

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(true);

    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = user.id;
    refreshTokenEntity.tokenHash = tokenHash;
    refreshTokenEntity.expiresAt = expiresAt;
    refreshTokenEntity.revokedAt = null;

    await this.authRepository.saveRefreshToken(refreshTokenEntity);

    return new AuthResult(accessToken, rawToken, user);
  }
}
