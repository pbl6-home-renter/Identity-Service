import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingExceptionFilter } from 'shared/presentation/http/filters/error-handling-exception.filter';
import { ResponseTransformInterceptor } from 'shared/presentation/http/interceptors/response-transform.interceptor';
import { SharedModule } from 'shared/shared.module';
import { SecurityModule } from 'shared/security.module';
import { HealthModule } from 'modules/health/health.module';
import { UsersModule } from 'modules/users/users.module';
import { AuthModule } from 'modules/auth/auth.module';
import { InboxModule } from 'modules/inbox/inbox.module';
import { OutboxModule } from 'modules/outbox/outbox.module';
import { MediaModule } from 'modules/media/media.module';

@Module({
  imports: [
    CqrsModule.forRoot(),
    SharedModule,
    SecurityModule,
    UsersModule,
    AuthModule,
    MediaModule,
    InboxModule,
    OutboxModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
