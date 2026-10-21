import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingExceptionFilter } from './filter/error-handling-exception-filter';
import { ResponseTransformInterceptor } from './interceptor/response-transform.interceptor';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { OutboxModule } from './modules/outbox/outbox.module';

@Module({
  imports: [
    CqrsModule.forRoot(),
    SharedModule,
    UsersModule,
    AuthModule,
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
