import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 📘 Configuración de Swagger
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
        description: 'Introduce tu token JWT aquí (formato: Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('App')
    .addTag('Auth')
    .addTag('User')
    .addTag('Follows')
    .addTag('Posts')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const isRender = process.env.RENDER === 'true';
  const port = process.env.PORT || 3000;

  // 🔹 Swagger debe montarse ANTES de app.listen
  if (isRender) {
    SwaggerModule.setup('api/docs', app, document);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on port ${port}`);
    console.log('📚 Swagger Render: /api/docs');
  } else {
    SwaggerModule.setup('docs', app, document);
    await app.listen(port);
    console.log(`🚀 Application is running on http://localhost:${port}`);
    console.log('📚 Swagger Local: /docs');
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error during application bootstrap:', error);
  process.exit(1);
});
