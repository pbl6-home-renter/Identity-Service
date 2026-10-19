import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get appName(): string {
    return this.getString('APP_NAME', 'MyApp');
  }

  get rabbitMqUrl(): string {
    return this.getString('RABBITMQ_URL', 'amqp://localhost:5672');
  }

  get apiDomain(): string {
    return this.getString('API_DOMAIN', 'localhost');
  }

  get serverPort(): number {
    return this.getNumber('PORT', 3001);
  }

  get enableSwagger(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION', true);
  }

  get logLevel(): string {
    return this.getString('LOG_LEVEL', 'debug');
  }

  get jwt(): {
    privateKey: string;
    publicKey: string;
    keyId: string;
    issuer: string;
    audience: string;
  } {
    return {
      privateKey: this.getString('JWT_PRIVATE_KEY'),
      publicKey: this.getString('JWT_PUBLIC_KEY'),
      keyId: this.getString('JWT_KEY_ID', 'rentify-identity-2026-01'),
      issuer: this.getString('JWT_ISSUER', 'rentify-identity'),
      audience: this.getString('JWT_AUDIENCE', 'rentify-api'),
    };
  }

  getAdminUser(): {
    id: string;
    email: string;
    password: string;
    name: string;
    phone: string;
  } {
    return {
      id: this.getString(
        'DEFAULT_ADMIN_ID',
        '00000000-0000-4000-8000-000000000001',
      ),
      email: this.getString('DEFAULT_ADMIN_EMAIL', 'admin@example.com'),
      password: this.getString('DEFAULT_ADMIN_PASSWORD', 'AdminPassword123!'),
      name: this.getString('DEFAULT_ADMIN_NAME', 'System Administrator'),
      phone: this.getString('DEFAULT_ADMIN_PHONE', '0900000000'),
    };
  }

  private getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable "${key}" is not a valid number`);
    }
    return parsed;
  }

  private getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    try {
      return Boolean(JSON.parse(value));
    } catch {
      return value === 'true';
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.get(key, defaultValue);
    return value.replaceAll('\\n', '\n');
  }

  private get(key: string, defaultValue?: string): string {
    const value = this.configService.get<string>(key);

    if (value === undefined || value === null || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable "${key}" is required but not set`);
    }

    return value;
  }
}
