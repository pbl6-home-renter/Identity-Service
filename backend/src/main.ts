import { Logger, RequestMethod } from '@nestjs/common';
import { AppValidationPipe } from './pipe/app-validation.pipe';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { configLogging } from './shared/configuration/config-logging';
import { configureSwagger } from './shared/configuration/config-swagger';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const configService = app.select(SharedModule).get(ApiConfigService);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableCors();

  app.useGlobalPipes(new AppValidationPipe());

  app.useBodyParser('json', { limit: '10mb', strict: false });
  app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

  app.use((req: any, _res: any, next: any) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentLength = req.headers['content-length'];
      const transferEncoding = req.headers['transfer-encoding'];
      if (
        contentLength === '0' ||
        (!contentLength &&
          !transferEncoding &&
          (req.body === undefined || Object.keys(req.body || {}).length === 0))
      ) {
        req.body = undefined;
      }
    }
    next();
  });

  configureSwagger(app, configService);
  configLogging(app, configService);

  await app.startAllMicroservices();
  await app.listen(configService.serverPort);

  const appUrl = await app.getUrl();

  Logger.log(`Application running on: ${appUrl}`);
  Logger.log(`Swagger documentation: ${appUrl}/swagger`);

  return app;
}

void bootstrap();
