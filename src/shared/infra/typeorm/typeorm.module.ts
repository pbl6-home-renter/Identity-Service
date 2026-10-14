import { Module } from '@nestjs/common';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseConfigService } from 'shared/services/database-config.service';
import { TypeOrmConfigService } from './typeorm-config.service';

@Module({
  imports: [
    NestTypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      inject: [DatabaseConfigService],
      dataSourceFactory: async (options: DataSourceOptions | undefined) => {
        if (!options) {
          throw new Error(
            'Invalid options passed to TypeOrm dataSourceFactory',
          );
        }
        return new DataSource(options).initialize();
      },
    }),
  ],
})
export class TypeormModule {}
