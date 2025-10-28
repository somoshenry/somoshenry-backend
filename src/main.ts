import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  await app.listen(process.env.PORT || 3000);

  const config = new DocumentBuilder()
    .setTitle('API - Red Social SomosHenry')
    .setDescription('Documentación de endpoints del backend (NestJS + TypeORM)')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  console.log(`🚀 Swagger disponible en /docs`);
}
bootstrap();
