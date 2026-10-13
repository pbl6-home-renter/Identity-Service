import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from '../../configuration/snake-naming.strategy';

const envFilePaths = [
  resolve(process.cwd(), '..', '.env'),
  resolve(process.cwd(), '.env'),
];

for (const envFilePath of envFilePaths) {
  if (!existsSync(envFilePath)) {
    continue;
  }

  process.loadEnvFile(envFilePath);
}

const databaseUrl =
  process.env.MIGRATION_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

function resolveSsl():
  | false
  | {
      rejectUnauthorized: boolean;
    } {
  const explicitSsl = process.env.DB_SSL;

  if (explicitSsl !== undefined && explicitSsl.trim() !== '') {
    return explicitSsl.trim().toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false;
  }

  const connectionTarget = databaseUrl ?? process.env.DB_HOST ?? '';

  if (!connectionTarget) {
    return false;
  }

  try {
    const hostname = databaseUrl
      ? new URL(databaseUrl).hostname
      : connectionTarget;

    if (
      hostname.endsWith('.supabase.co') ||
      hostname.endsWith('.pooler.supabase.com')
    ) {
      return { rejectUnauthorized: false };
    }
  } catch {
    // PostgreSQL will report malformed connection strings.
  }

  return false;
}

const connectionOptions = databaseUrl
  ? {
      url: databaseUrl,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT
        ? Number.parseInt(process.env.DB_PORT, 10)
        : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'identity_db',
    };

export function createDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    ...connectionOptions,
    ssl: resolveSsl(),
    dropSchema: false,
    namingStrategy: new SnakeNamingStrategy(),
    logging: process.env.ENABLE_ORM_LOGS === 'true',
    entities: [
      __dirname +
        '/../../../modules/**/infra/persistence/*{.typeorm-entity,.entity}{.ts,.js}',
    ],
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  };
}
