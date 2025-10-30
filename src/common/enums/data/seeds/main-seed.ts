import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../../../app.module'; // Usa tu config TypeORM ya definida en AppModule
import { SeederModule } from './seeder.module';
import { SeederService } from './SeederService';
import { Module } from '@nestjs/common';

// Módulo raíz para el seed: reusa AppModule (conexión DB) + añade SeederModule (repos + servicio)
@Module({
  imports: [AppModule, SeederModule],
})
class RootSeedModule {}

async function bootstrap() {
  const logger = new Logger('Seeder');
  const app = await NestFactory.createApplicationContext(RootSeedModule, {
    logger: ['error', 'log', 'warn'],
  });
  try {
    const seeder = app.get(SeederService);
    await seeder.run();
    logger.log('🌾 Seed finalizado sin errores.');
  } catch (e) {
    logger.error('❌ Falló el seeder', e);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}
bootstrap().catch((error) => {
  console.error('Error during seeder bootstrap:', error);
  process.exit(1);
});
