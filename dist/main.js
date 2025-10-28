"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('API - Red Social SomosHenry')
        .setDescription('Documentación de endpoints del backend (NestJS + TypeORM)')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const isRender = process.env.RENDER === 'true';
    if (isRender) {
        swagger_1.SwaggerModule.setup('api/docs', app, document);
        await app.listen(process.env.PORT || 3000, '0.0.0.0');
        console.log('🚀 Swagger Render: /api/docs');
    }
    else {
        swagger_1.SwaggerModule.setup('docs', app, document);
        await app.listen(process.env.PORT || 3000);
        console.log('🚀 Swagger Local: /docs');
    }
}
bootstrap();
//# sourceMappingURL=main.js.map