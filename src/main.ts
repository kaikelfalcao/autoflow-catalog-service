// eslint-disable-next-line @typescript-eslint/no-require-imports
require('newrelic');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Catalog Service')
    .setDescription(
      `REST API for the **catalog-service** microservice.\n\n` +
        `Manages two subdomains:\n` +
        `- **Parts** — physical parts and supplies with full stock control (reserve → consume → release via Saga)\n` +
        `- **Services** — workshop services (oil change, alignment, etc.) with pricing and duration\n\n` +
        `All error responses follow the shape:\n` +
        `\`{ statusCode, error, message, timestamp, path, correlationId }\``,
    )
    .setVersion('1.0')
    .setContact('AutoFlow', '', 'autoflow@example.com')
    .addServer('http://localhost:3003', 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
}

void bootstrap();
