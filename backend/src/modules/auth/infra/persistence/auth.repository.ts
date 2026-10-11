import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { RefreshTokenEntity } from './refresh-token.entity';

@Injectable()
export class TypeOrmAuthRepository implements AuthRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  async saveRefreshToken(token: RefreshTokenEntity): Promise<void> {
    await this.refreshTokenRepository.save(token);
  }
}
