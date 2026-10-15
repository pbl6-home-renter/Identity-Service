import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { AuthRegisterCommand } from '../implements/auth-register.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { TokenService } from '../../../infra/services/token.service';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../../../users/domain/entities/user';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import { EmailAlreadyExistsException } from 'shared/domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from 'shared/domain/exceptions/phone-already-exists.exception';
import { AuthRegisterRoleNotAllowedException } from '../../../domain/exceptions/auth-register-role-not-allowed.exception';

@CommandHandler(AuthRegisterCommand)
export class AuthRegisterCommandHandler implements ICommandHandler<
  AuthRegisterCommand,
  AuthResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: AuthRegisterCommand): Promise<AuthResult> {
    this.validateRole(command.role);
    await this.validateUniqueCredentials(command.email, command.phone);

    const user = await this.createUser(command);
    const { accessToken, rawRefreshToken } = await this.issueTokens(user);

    return AuthResult.create(accessToken, rawRefreshToken, user);
  }

  private validateRole(role: UserRole): void {
    if (role === UserRole.ADMIN) {
      throw new AuthRegisterRoleNotAllowedException(role);
    }
  }

  private async validateUniqueCredentials(
    email: string,
    phone: string,
  ): Promise<void> {
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(email);
    }

    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new PhoneAlreadyExistsException(phone);
    }
  }

  private async createUser(command: AuthRegisterCommand): Promise<User> {
    const hashedPassword = await BcryptUtils.hash(command.password);

    const user = User.create({
      name: command.name,
      email: command.email,
      phone: command.phone,
      password: hashedPassword,
      role: command.role,
      status: UserStatus.ACTIVE,
      lockReason: null,
      lockedAt: null,
    });

    await this.userRepository.save(user);
    return user;
  }

  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(true);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });

    await this.authRepository.saveRefreshToken(refreshToken);
    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    return { accessToken, rawRefreshToken: rawToken };
  }
}
