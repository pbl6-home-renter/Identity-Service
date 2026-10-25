import { Injectable } from '@nestjs/common';
import { ApiConfigService } from 'shared/infrastructure/config/api-config.service';
import { getConfigString } from 'shared/infrastructure/config/config-value';
import { ConfigService } from '@nestjs/config';

/**
 * Signing side of the access token. Only Identity-Service owns the private key.
 * Issuer, audience and public key come from `ApiConfigService.auth`, the same
 * source the `AccessTokenVerifier` uses, so signed tokens always pass our own
 * verification.
 */
@Injectable()
export class JwtConfigService {
  constructor(
    private readonly configService: ConfigService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  get privateKey(): string {
    return getConfigString(this.configService, 'JWT_PRIVATE_KEY');
  }

  get publicKey(): string {
    const { publicKey } = this.apiConfig.auth;
    if (!publicKey) {
      throw new Error('Environment variable "JWT_PUBLIC_KEY" is required');
    }
    return publicKey;
  }

  get keyId(): string {
    return getConfigString(
      this.configService,
      'JWT_KEY_ID',
      'rentify-identity-2026-01',
    );
  }

  get issuer(): string {
    return this.apiConfig.auth.issuer;
  }

  get audience(): string {
    return this.apiConfig.auth.audience;
  }
}
