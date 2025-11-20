import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();
export default registerAs('typeorm', () => {
  const useSSL = process.env.DB_SSL === 'true';

  // Determinar si es conexión remota basada en el host
  const host = process.env.DB_HOST || 'localhost';
  const isRemote =
    host.includes('render.com') ||
    host.includes('amazonaws.com') ||
    !!process.env.DATABASE_URL;

  if (isRemote) {
    console.log(
      `Conectando a base de datos remota (${host}) con SSL: ${useSSL}...`,
    );
  } else {
    console.log('Conectando a base de datos local...');
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somoshenry',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    timezone: 'UTC',
    retryAttempts: 5,
    retryDelay: 3000,
  };
});
