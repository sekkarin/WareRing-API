import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { corsOptions } from './utils/corsOptions';
import { AllExceptionsFilter } from './all-exceptionsFilter';
import { LoggerService } from './logger/logger.service';

const configService = new ConfigService();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: true,
  });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useLogger(app.get(LoggerService));
  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());
  app.enableCors({ ...corsOptions });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  if (process.env.NODE_ENV == 'dev') {
    const config = new DocumentBuilder()
      .setTitle('Warering api')
      .setDescription('The Warering API')
      .setVersion('1.0')
      .setExternalDoc('Nestjs', 'https://docs.nestjs.com/')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
  await app.listen(configService.get<number>('PORT') || process.env.PORT);
}
bootstrap();
