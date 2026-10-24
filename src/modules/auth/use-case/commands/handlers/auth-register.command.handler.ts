import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { AuthRegisterCommand } from '../implements/auth-register.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../../domain/services/token.service.interface';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../../../users/domain/entities/user';
import { Email } from '../../../../users/domain/value-objects/email.vo';
import { Phone } from '../../../../users/domain/value-objects/phone.vo';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import { EmailAlreadyExistsException } from 'modules/users/domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from 'modules/users/domain/exceptions/phone-already-exists.exception';
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
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: AuthRegisterCommand): Promise<AuthResult> {
    this.validateRole(command.role);
    const email = Email.create(command.email);
    const phone = Phone.create(command.phone);
    await this.validateUniqueCredentials(email, phone);

    const user = await this.createUser(command, email, phone);
    const { accessToken, rawRefreshToken } = await this.issueTokens(user);

    return AuthResult.create(accessToken, rawRefreshToken, user);
  }

  private validateRole(role: UserRole): void {
    if (role === UserRole.ADMIN) {
      throw new AuthRegisterRoleNotAllowedException(role);
    }
  }

  private async validateUniqueCredentials(
    email: Email,
    phone: Phone,
  ): Promise<void> {
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(email.value);
    }

    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new PhoneAlreadyExistsException(phone.value);
    }
  }

  private async createUser(
    command: AuthRegisterCommand,
    email: Email,
    phone: Phone,
  ): Promise<User> {
    const hashedPassword = await BcryptUtils.hash(command.password);

    const user = User.create({
      name: command.name,
      email,
      phone,
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
    const { rawRefreshToken, refreshTokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(true);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      revokedAt: null,
    });

    await this.authRepository.saveRefreshToken(refreshToken);
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.role,
      user.status,
    );
    return { accessToken, rawRefreshToken };
  }
}
