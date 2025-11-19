import { FileType } from 'src/modules/cohorte/cohorte/entities/cohorte-material.entity';

/**
 * Extrae el public_id de una URL de Cloudinary.
 * https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<public_id>.<format>
 * Ejemplo:
 * https://res.cloudinary.com/demo/image/upload/v1693320982/user_pictures/profile_abc123.webp
 *  --> retorna 'user_pictures/profile_abc123' (folder/name)
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    // Ejemplo: divide después de '/upload/' y antes de la extensión
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = url.substring(uploadIndex + '/upload/'.length);
    // Remueve parámetros tipo '?_a=...' si existen
    const clean = afterUpload.split(/[?#]/)[0];
    // Remueve extensión (.jpg, .png, etc.)
    const withoutExtension = clean.replace(/\.[^/.]+$/, '');
    // Remueve la versión (v123456...)
    return withoutExtension.replace(/^v[0-9]+\//, '');
  } catch {
    return null;
  }
}

export function detectResourceTypeFromUrl(
  url: string,
): 'image' | 'video' | 'raw' {
  if (url.includes('/image/upload/')) return 'image';
  if (url.includes('/video/upload/')) return 'video';
  return 'raw'; // fallback para archivos PDF, ZIP, etc.
}

export function getFileTypeFromUrl(url: string): FileType {
  const lower = url.toLowerCase();

  // Sacar la extensión del archivo
  const match = lower.match(/\.([a-z0-9]+)(\?|$)/);
  const ext = match ? match[1] : '';

  // 1. PDF
  if (ext === 'pdf') return FileType.PDF;

  // 2. Imágenes
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(ext))
    return FileType.IMAGE;

  // 3. Videos
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'].includes(ext))
    return FileType.VIDEO;

  // 4. Audio
  if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(ext))
    return FileType.AUDIO;

  // 5. Documentos (Word, texto, etc.)
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext))
    return FileType.DOCUMENT;

  // 6. Hojas de cálculo
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return FileType.SPREADSHEET;

  // 7. Presentaciones
  if (['ppt', 'pptx', 'odp'].includes(ext)) return FileType.PRESENTATION;

  // 8. Comprimidos
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return FileType.COMPRESSED;

  return FileType.OTHER;
}
