import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ApiConfigService } from 'shared/services/api-config.service';

export function configureSwagger(
  app: INestApplication,
  configService: ApiConfigService,
) {
  if (configService.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Identity Service API')
      .setDescription('Auth, users and landlord profiles')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('identity/swagger', app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: 'identity/swagger/json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
