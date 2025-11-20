import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();
export default registerAs('typeorm', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbSSL = process.env.DB_SSL === 'true';

  console.log(`[TypeORM Config] NODE_ENV: ${nodeEnv}`);
  console.log(
    `[TypeORM Config] DATABASE_URL: ${databaseUrl ? 'SET' : 'NOT SET'}`,
  );
  console.log(
    `[TypeORM Config] DB_HOST: ${dbHost || 'NOT SET (usando localhost)'}`,
  );
  console.log(`[TypeORM Config] DB_SSL: ${dbSSL}`);

  // Preferir DATABASE_URL si existe (para Render/producción)
  if (databaseUrl) {
    console.log('[TypeORM] ✅ Usando DATABASE_URL para conexión');
    console.log(`[TypeORM] DATABASE_URL: ${databaseUrl.substring(0, 80)}...`);
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: nodeEnv === 'development',
      timezone: 'UTC',
      retryAttempts: 5,
      retryDelay: 3000,
    };
  }

  // Fallback a configuración individual
  console.log('[TypeORM] ⚠️  DATABASE_URL NO encontrada, usando configuración individual');
  const host = dbHost || 'localhost';
  const port = parseInt(dbPort || '5432', 10);
  const username = dbUser || 'postgres';
  const password = dbPassword || '';
  const database = dbName || 'somoshenry';

  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  if (isLocalhost) {
    console.log(`[TypeORM] Conectando a PostgreSQL local (${host}:${port})`);
  } else {
    console.log(
      `[TypeORM] Conectando a PostgreSQL remoto (${host}:${port}) con SSL: ${dbSSL}`,
    );
  }

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize: nodeEnv === 'development',
    ssl: dbSSL ? { rejectUnauthorized: false } : false,
    timezone: 'UTC',
    retryAttempts: 5,
    retryDelay: 3000,
  };
});
