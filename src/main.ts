import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API - Red Social SomosHenry')
    .setDescription('Documentación de endpoints del backend (NestJS + TypeORM)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth')
    .addTag('Usuarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const isRender = process.env.RENDER === 'true';

  if (isRender) {
    SwaggerModule.setup('api/docs', app, document);
    await app.listen(process.env.PORT || 3000, '0.0.0.0');
    console.log('🚀 Swagger Render: /api/docs');
  } else {
    SwaggerModule.setup('docs', app, document);
    await app.listen(process.env.PORT || 3000);
    console.log('🚀 Swagger Local: /docs');
  }
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
  process.exit(1);
});
