import { v2 as cloudinary } from 'cloudinary';
import { config as dotenvConfig } from 'dotenv';

// Solo cargamos dotenv si no estamos en Render
if (!process.env.RENDER) {
  dotenvConfig(); // busca automáticamente .env o .env.development
}

// Custom provider
export const CloudinaryConfig = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
  },
};
