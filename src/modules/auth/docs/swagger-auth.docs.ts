import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { CredentialDto } from '../dto/credential.dto';
import { LoginResponseOkDto } from '../dto/login.response.ok.dto';

// --- I. EXAMPLES ---

export const SwaggerAuthExamples = {
  // Ejemplo de cuerpo para registro (debería ser igual a CreateUserDto)
  registerBody: {
    email: 'test@ejemplo.com',
    password: 'Password123',
    nombre: 'Usuario',
    apellido: 'Prueba',
    // Opcional: incluir tipo y estado si son requeridos por CreateUserDto
  },

  // Ejemplo de cuerpo para login y update-password (CredentialDto)
  credentialBody: {
    email: 'test@ejemplo.com',
    password: 'Password123',
  },

  // Ejemplo de respuesta de login
  loginResponse: {
    message: 'Login exitoso',
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZjFhNGMzYi03ZjlkLTQzYTItOWJiMS1kY2VmZTFiNmIxMjMiLCJpYXQiOjE2NjcwNDAyMDIsImV4cCI6MTY2NzA0MDI2Mn0.xxxxxxx_JWT_TOKEN_xxxxxxx',
  },

  // Respuesta simple de mensaje
  messageResponse: {
    message: 'Operación exitosa',
  },
};

// --- II. DOCS DECORATORS ---

export const SwaggerAuthDocs = {
  register: [
    ApiOperation({
      summary: 'Registra un nuevo usuario en la plataforma.',
      description:
        'Crea un nuevo usuario y su cuenta de acceso. Retorna el objeto del usuario creado.',
    }),
    ApiBody({
      type: CreateUserDto,
      description: 'Datos necesarios para la creación del usuario.',
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario creado exitosamente.',
      schema: { example: SwaggerAuthExamples.registerBody }, // Usamos el cuerpo como ejemplo para la entidad Usuario
      // NOTA: Si `Usuario` es una clase Nest, es mejor usar `type: Usuario` en el controlador y simplificar aquí.
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos de entrada inválidos (ej. email duplicado o password débil).',
    }),
  ],

  login: [
    ApiOperation({
      summary: 'Autenticación de usuario y generación de JWT.',
      description:
        'Valida las credenciales del usuario (email y password) y, si son correctas, retorna un token JWT para acceso a recursos protegidos.',
    }),
    ApiBody({
      type: CredentialDto,
      description: 'Credenciales (email y password) del usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'Inicio de sesión exitoso. Retorna el token JWT.',
      schema: { example: SwaggerAuthExamples.loginResponse },
      type: LoginResponseOkDto, // Si usas la clase, es mejor mantenerla aquí
    }),
    ApiResponse({
      status: 400,
      description: 'Credenciales inválidas (email o password incorrectos).',
    }),
  ],

  updatePassword: [
    ApiOperation({
      summary: 'Actualiza la contraseña de un usuario a través de su email.',
      description:
        'Requiere el email del usuario para identificarlo y la nueva contraseña. (Se asume validación de identidad previa o por token).',
    }),
    ApiBody({
      type: CredentialDto,
      description:
        'El campo `email` para identificación del usuario, y `password` para la nueva contraseña.',
    }),
    ApiResponse({
      status: 200,
      description: 'Contraseña actualizada exitosamente.',
      schema: { example: { message: 'Contraseña actualizada exitosamente' } },
    }),
    ApiResponse({
      status: 401,
      description: 'Usuario no encontrado o error en el proceso.',
    }),
  ],
};
