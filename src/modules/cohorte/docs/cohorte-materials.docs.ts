import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  FileType,
  MaterialCategory,
} from '../cohorte/entities/cohorte-material.entity';

// ============================================
// CREAR MATERIAL
// ============================================
export function ApiCreateMaterial() {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir un nuevo material al cohorte',
      description:
        'Permite a profesores subir archivos (PDFs, imágenes, videos, etc.) al cohorte. Solo profesores y admins pueden usar este endpoint.',
    }),
    ApiParam({
      name: 'cohorteId',
      description: 'ID del cohorte donde se subirá el material',
      example: 'abc-123-def-456',
    }),
    ApiResponse({
      status: 201,
      description: 'Material creado exitosamente',
      schema: {
        example: {
          id: 'material-123',
          cohorteId: 'abc-123',
          uploadedBy: 'user-456',
          fileName: 'JavaScript_Avanzado.pdf',
          fileUrl: 'https://s3.amazonaws.com/bucket/js-avanzado.pdf',
          fileType: 'PDF',
          fileSize: 1024000,
          category: 'MODULE_2',
          title: 'Guía de JavaScript ES6+',
          description: 'Material completo sobre JavaScript moderno',
          isVisible: true,
          downloadCount: 0,
          tags: ['javascript', 'es6'],
          createdAt: '2025-11-18T20:00:00.000Z',
          updatedAt: '2025-11-18T20:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos (solo profesores)',
    }),
    ApiResponse({ status: 404, description: 'Cohorte no encontrado' }),
  );
}

// ============================================
// LISTAR MATERIALES
// ============================================
export function ApiGetMaterials() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener todos los materiales del cohorte',
      description:
        'Lista paginada y filtrable de materiales. Permite buscar por categoría, tipo, tags, y texto.',
    }),
    ApiParam({
      name: 'cohorteId',
      description: 'ID del cohorte',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Cantidad por página (por defecto: 20)',
      example: 20,
    }),
    ApiQuery({
      name: 'category',
      required: false,
      enum: MaterialCategory,
      description: 'Filtrar por categoría',
    }),
    ApiQuery({
      name: 'fileType',
      required: false,
      enum: FileType,
      description: 'Filtrar por tipo de archivo',
    }),
    ApiQuery({
      name: 'isVisible',
      required: false,
      type: Boolean,
      description: 'Filtrar por visibilidad',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Buscar en título, descripción y nombre de archivo',
    }),
    ApiQuery({
      name: 'tag',
      required: false,
      type: String,
      description: 'Filtrar por tag específico',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de materiales obtenida exitosamente',
      schema: {
        example: {
          data: [
            {
              id: 'material-123',
              fileName: 'JavaScript_Avanzado.pdf',
              fileUrl: 'https://...',
              fileType: 'PDF',
              category: 'MODULE_2',
              title: 'Guía de JavaScript',
              isVisible: true,
              downloadCount: 15,
              createdAt: '2025-11-18T20:00:00.000Z',
              uploader: {
                id: 'user-456',
                firstName: 'Juan',
                lastName: 'Pérez',
              },
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            total: 50,
            totalPages: 3,
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Cohorte no encontrado' }),
  );
}

// ============================================
// OBTENER UN MATERIAL
// ============================================
export function ApiGetOneMaterial() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener detalles de un material específico',
      description:
        'Retorna información completa de un material, incluyendo datos del uploader.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Material encontrado',
      schema: {
        example: {
          id: 'material-123',
          cohorteId: 'abc-123',
          uploadedBy: 'user-456',
          fileName: 'JavaScript_Avanzado.pdf',
          fileUrl: 'https://s3.amazonaws.com/bucket/js-avanzado.pdf',
          fileType: 'PDF',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          category: 'MODULE_2',
          title: 'Guía de JavaScript ES6+',
          description: 'Material completo',
          isVisible: true,
          downloadCount: 15,
          tags: ['javascript', 'es6'],
          createdAt: '2025-11-18T20:00:00.000Z',
          uploader: {
            id: 'user-456',
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}

// ============================================
// ACTUALIZAR MATERIAL
// ============================================
export function ApiUpdateMaterial() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar un material',
      description:
        'Solo el profesor que subió el material puede actualizarlo. Permite cambiar título, descripción, categoría, etc.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Material actualizado exitosamente',
    }),
    ApiResponse({
      status: 403,
      description:
        'No tienes permisos (solo el que lo subió puede actualizarlo)',
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}

// ============================================
// ELIMINAR MATERIAL
// ============================================
export function ApiDeleteMaterial() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar un material',
      description:
        'Solo el profesor que subió el material puede eliminarlo. Esta acción no se puede deshacer.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Material eliminado exitosamente',
      schema: {
        example: {
          message: 'Material eliminado exitosamente',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos (solo el que lo subió puede eliminarlo)',
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}

// ============================================
// REGISTRAR DESCARGA
// ============================================
export function ApiRegisterDownload() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar una descarga del material',
      description:
        'Incrementa el contador de descargas. Útil para estadísticas de uso.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Descarga registrada',
      schema: {
        example: {
          message: 'Descarga registrada',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}

// ============================================
// CAMBIAR VISIBILIDAD
// ============================================
export function ApiToggleVisibility() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cambiar visibilidad del material',
      description:
        'Oculta o muestra el material a los estudiantes. Solo el profesor que lo subió puede cambiar la visibilidad.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Visibilidad actualizada',
      schema: {
        example: {
          id: 'material-123',
          isVisible: false,
          updatedAt: '2025-11-18T20:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos (solo el que lo subió)',
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}

// ============================================
// OBTENER POR CATEGORÍA
// ============================================
export function ApiGetByCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener materiales por categoría',
      description:
        'Retorna solo materiales visibles de una categoría específica (ej: MODULE_1, PROYECTO, etc).',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({
      name: 'category',
      enum: MaterialCategory,
      description: 'Categoría del material',
      example: 'MODULE_2',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de materiales de la categoría',
      schema: {
        example: [
          {
            id: 'material-123',
            fileName: 'JavaScript_Avanzado.pdf',
            fileType: 'PDF',
            category: 'MODULE_2',
            title: 'Guía de JavaScript',
            downloadCount: 15,
            createdAt: '2025-11-18T20:00:00.000Z',
          },
        ],
      },
    }),
  );
}

// ============================================
// OBTENER POR TIPO
// ============================================
export function ApiGetByType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener materiales por tipo de archivo',
      description:
        'Retorna solo materiales visibles de un tipo específico (PDF, IMAGE, VIDEO, etc).',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({
      name: 'fileType',
      enum: FileType,
      description: 'Tipo de archivo',
      example: 'PDF',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de materiales del tipo',
      schema: {
        example: [
          {
            id: 'material-123',
            fileName: 'JavaScript_Avanzado.pdf',
            fileType: 'PDF',
            category: 'MODULE_2',
            downloadCount: 15,
          },
        ],
      },
    }),
  );
}

// ============================================
// BUSCAR POR TAG
// ============================================
export function ApiGetByTag() {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar materiales por tag',
      description:
        'Retorna materiales visibles que contengan el tag especificado.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({
      name: 'tag',
      description: 'Tag a buscar',
      example: 'javascript',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de materiales con el tag',
      schema: {
        example: [
          {
            id: 'material-123',
            fileName: 'JavaScript_Avanzado.pdf',
            tags: ['javascript', 'es6', 'modulo2'],
            downloadCount: 15,
          },
        ],
      },
    }),
  );
}

// ============================================
// ESTADÍSTICAS
// ============================================
export function ApiGetStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener estadísticas de materiales del cohorte',
      description:
        'Solo para profesores. Retorna contadores, distribución por categoría/tipo, descargas totales y materiales más populares.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas',
      schema: {
        example: {
          total: 50,
          visible: 45,
          hidden: 5,
          byCategory: [
            { category: 'MODULE_1', count: 10 },
            { category: 'MODULE_2', count: 15 },
            { category: 'GENERAL', count: 20 },
          ],
          byType: [
            { fileType: 'PDF', count: 30 },
            { fileType: 'IMAGE', count: 10 },
            { fileType: 'VIDEO', count: 10 },
          ],
          totalDownloads: 1250,
          mostDownloaded: [
            {
              id: 'material-123',
              fileName: 'JavaScript_Avanzado.pdf',
              downloadCount: 150,
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos (solo profesores)',
    }),
  );
}

// ============================================
// MATERIALES RECIENTES
// ============================================
export function ApiGetRecent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener materiales más recientes',
      description:
        'Retorna los materiales más recientemente subidos, ordenados por fecha de creación.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Cantidad de materiales (por defecto: 10)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de materiales recientes',
      schema: {
        example: [
          {
            id: 'material-123',
            fileName: 'JavaScript_Avanzado.pdf',
            fileType: 'PDF',
            category: 'MODULE_2',
            createdAt: '2025-11-18T20:00:00.000Z',
          },
        ],
      },
    }),
  );
}

// ============================================
// ACTUALIZAR TAGS
// ============================================
export function ApiUpdateTags() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar tags de un material',
      description:
        'Reemplaza los tags del material. Solo el profesor que lo subió puede actualizar los tags.',
    }),
    ApiParam({ name: 'cohorteId', description: 'ID del cohorte' }),
    ApiParam({ name: 'id', description: 'ID del material' }),
    ApiResponse({
      status: 200,
      description: 'Tags actualizados',
      schema: {
        example: {
          id: 'material-123',
          tags: ['javascript', 'es6', 'avanzado'],
          updatedAt: '2025-11-18T20:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos (solo el que lo subió)',
    }),
    ApiResponse({ status: 404, description: 'Material no encontrado' }),
  );
}
