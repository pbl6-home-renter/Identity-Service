import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterCommand } from './register.command';
import { AuthResultVo } from '../../domain/value-objects/auth-result.vo';
import { USERS_DI_TOKEN } from '../../../users/users.di-token';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { AUTH_DI_TOKEN } from '../../auth.di-token';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { TokenService } from '../../infra/services/token.service';
import { UserRole } from '../../../users/domain/enums/user-role.enum';
import { UserStatus } from '../../../users/domain/enums/user-status.enum';
import { User } from '../../../users/domain/entities/user';
import { RefreshTokenEntity } from '../../infra/persistence/refresh-token.entity';
import {
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
  RoleNotAllowedException,
} from '../../domain/exceptions/auth.exceptions';

@CommandHandler(RegisterCommand)
export class RegisterCommandHandler implements ICommandHandler<
  RegisterCommand,
  AuthResultVo
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResultVo> {
    const { name, email, phone, password, role } = command;

    // 1. Role validation: admin is strictly forbidden from public registration
    if (role === UserRole.ADMIN || (role as string) === 'admin') {
      throw new RoleNotAllowedException(role);
    }

    // 2. Uniqueness check
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(email);
    }

    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new PhoneAlreadyExistsException(phone);
    }

    // 3. Hash password using bcrypt salt 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User domain entity
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

    // 5. Generate access token & refresh token
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

    return new AuthResultVo(accessToken, rawToken, user);
  }
}
