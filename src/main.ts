import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { corsOptions } from './utils/corsOptions';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

const configService = new ConfigService();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['debug', 'error', 'log', 'verbose', 'warn'],
  });
  app.use(cookieParser());
  app.useStaticAssets(path.join(__dirname, '../'));
  app.enableCors({ ...corsOptions });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
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
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(configService.get<number>('PORT') || process.env.PORT);
}
bootstrap();
