import { Injectable } from '@nestjs/common';
import toStream from 'buffer-to-stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FilesRepository {
  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' }, // 'auto' para cualquier tipo de archivo
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: string,
  ): Promise<{ result: string }> {
    try {
      const type = resourceType ?? 'image'; // valor por defecto si la variable que le precede es null o undefined
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
      });
      return result; // Devuelve { result: 'ok' } si se eliminó correctamente
    } catch (error) {
      console.error(`Error deleting file ${publicId}:`, error.message);
      // Devolvemos un resultado indicando que falló, pero sin lanzar excepción
      return { result: 'error' };
    }
  }
}
