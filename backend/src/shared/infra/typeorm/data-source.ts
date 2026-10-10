import 'reflect-metadata';
import 'tsconfig-paths/register';
import type { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../../configuration/snake-naming.strategy';

try {
  (process as any).loadEnvFile?.();
} catch {}

export const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'identity_db',
  dropSchema: false,
  keepConnectionAlive: true,
  namingStrategy: new SnakeNamingStrategy(),
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    __dirname +
      '/../../../modules/**/infra/persistence/*{.typeorm-entity,.entity}{.ts,.js}',
  ],
  migrations: [
    __dirname + '/../../../migrations/**/*{.ts,.js}',
    __dirname + '/migrations/**/*{.ts,.js}',
  ],
} as DataSourceOptions);
