import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CohorteResponseDto } from './responses/cohorte-response';
import { CohorteWithMembersResponseDto } from './responses/cohorte-with-members-response';
import { CohortememberResponseDto } from './responses/cohortemember-response';
import { CreateCohorteRequestDto } from './requests/create-cohorte-request';
import { UpdateCohorteRequestDto } from './requests/update-cohorte-request';
import { AddMemberRequestDto } from './requests/add-member-request';

export const CohorteDocs = {
  tag: () => ApiTags('Cohortes'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear una nueva cohorte',
        description:
          'Permite al administrador crear una nueva cohorte con los parámetros especificados. Requiere rol de administrador.',
      }),
    body: () => ApiBody({ type: CreateCohorteRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Cohorte creada exitosamente',
        type: CohorteResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description:
          'Solicitud inválida. Verifique que todos los campos requeridos estén presentes y tengan el formato correcto.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'name should not be empty',
              'name must be a string',
              'name must be shorter than or equal to 100 characters',
            ],
            error: 'Bad Request',
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener todas las cohortes',
        description:
          'Retorna una lista de todas las cohortes con información de miembros y clases relacionadas.',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de cohortes obtenida exitosamente',
        type: [CohorteWithMembersResponseDto],
      }),
  },

  findOne: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener una cohorte por ID',
        description:
          'Obtiene los detalles completos de una cohorte específica incluyendo miembros y clases.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Cohorte encontrada y retornada exitosamente',
        type: CohorteWithMembersResponseDto,
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  update: {
    summary: () =>
      ApiOperation({
        summary: 'Actualizar una cohorte',
        description:
          'Permite actualizar los campos de una cohorte existente. Requiere rol de administrador. Todos los campos son opcionales.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte a actualizar',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    body: () => ApiBody({ type: UpdateCohorteRequestDto }),
    ok: () =>
      ApiOkResponse({
        description: 'Cohorte actualizada exitosamente',
        type: CohorteResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description:
          'Solicitud inválida. Verifique los tipos de datos de los campos enviados.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'modality must be one of the following values: FULL_TIME, PART_TIME',
            ],
            error: 'Bad Request',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  remove: {
    summary: () =>
      ApiOperation({
        summary: 'Eliminar una cohorte',
        description:
          'Elimina una cohorte existente. Esta acción es irreversible. Requiere rol de administrador.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte a eliminar',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    noContent: () =>
      ApiNoContentResponse({
        description: 'Cohorte eliminada exitosamente',
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  members: {
    addSummary: () =>
      ApiOperation({
        summary: 'Agregar un usuario como miembro de la cohorte',
        description:
          'Añade un usuario a la cohorte con el rol especificado. Requiere rol de administrador. Un usuario no puede ser agregado dos veces a la misma cohorte.',
      }),
    addParam: () =>
      [
        ApiParam({
          name: 'id',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único de la cohorte',
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
        ApiParam({
          name: 'userId',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único del usuario a agregar',
          example: '550e8400-e29b-41d4-a716-446655440001',
        }),
      ] as any,
    addBody: () => ApiBody({ type: AddMemberRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Miembro agregado a la cohorte exitosamente',
        type: CohortememberResponseDto,
      }),
    memberNotFound: () =>
      ApiNotFoundResponse({
        description: 'La cohorte o el usuario especificado no existe',
        schema: {
          example: {
            statusCode: 404,
            message: 'Usuario no encontrado',
            error: 'Not Found',
          },
        },
      }),
    memberAlreadyExists: () =>
      ApiBadRequestResponse({
        description: 'El usuario ya es miembro de esta cohorte',
        schema: {
          example: {
            statusCode: 400,
            message: 'El usuario ya pertenece a la cohorte',
            error: 'Bad Request',
          },
        },
      }),

    removeSummary: () =>
      ApiOperation({
        summary: 'Eliminar un usuario de la cohorte',
        description:
          'Remueve un miembro de la cohorte. Requiere rol de administrador.',
      }),
    removeParam: () =>
      [
        ApiParam({
          name: 'id',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único de la cohorte',
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
        ApiParam({
          name: 'userId',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único del usuario a remover',
          example: '550e8400-e29b-41d4-a716-446655440001',
        }),
      ] as any,
    noContent: () =>
      ApiNoContentResponse({
        description: 'Miembro eliminado de la cohorte exitosamente',
      }),
    memberRemoveNotFound: () =>
      ApiNotFoundResponse({
        description: 'El miembro especificado no existe en la cohorte',
        schema: {
          example: {
            statusCode: 404,
            message: 'Miembro no encontrado',
            error: 'Not Found',
          },
        },
      }),
  },
};
