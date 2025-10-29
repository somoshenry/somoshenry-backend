import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default registerAs('typeorm', () => {
  const isRender = !!process.env.DATABASE_URL; // detecta si está corriendo en Render

  if (isRender) {
    console.log('🟢 Conectando a base de datos Render...');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: true, // ⚠️ solo en desarrollo
    };
  }

  console.log('🧩 Conectando a base de datos local...');
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'socialdb',
    autoLoadEntities: true,
    synchronize: true, // ⚠️ solo mientras desarrollás
  };
});
