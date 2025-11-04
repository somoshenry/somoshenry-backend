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
