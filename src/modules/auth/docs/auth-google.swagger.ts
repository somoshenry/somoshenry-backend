// src/modules/auth/docs/docs/auth-google.swagger.ts (Ejemplo de contenido)
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const SwaggerGoogleDocs = {
  // Documentación para GET /auth/google
  auth: [
    ApiOperation({
      summary: 'Iniciar sesión/registro con Google (OAuth)',
      description:
        'Endpoint para iniciar el flujo de autenticación OAuth de Google. **Redirige** al usuario al sitio web de Google para ingresar sus credenciales.',
    }),
    // ⚠️ La clave es indicar el código de estado 302
    ApiResponse({
      status: 302, // Código 302: Found (Redirección temporal)
      description:
        'El navegador es redirigido a la URL de autenticación de Google.',
    }),
    ApiResponse({
      status: 401,
      description: 'Error de autenticación o configuración.',
    }),
  ],

  callback: [
    ApiOperation({
      summary: 'Callback de Google OAuth2.0',
      description:
        'Endpoint invocado por Google tras la autenticación. Siempre resulta en una redirección (302) al frontend.',
    }),

    // ⬇️ Documentación UNIFICADA del código 302
    ApiResponse({
      status: 302,
      description:
        'El navegador es redirigido a una de las dos URLs del frontend, conteniendo el **token JWT (éxito)** o un **mensaje de error (fallo)**.',
      // Usamos el 'schema' para mostrar ambos ejemplos de URL como una matriz de posibles resultados
      schema: {
        oneOf: [
          {
            title: 'ÉXITO (Redirección con Token)',
            example: 'http://frontend.com/auth/callback?token=eyJhbGciOiJ...',
          },
          {
            title: 'FALLO (Redirección con Error)',
            example:
              'http://frontend.com/auth/error?error=Error_generando_token',
          },
        ],
      },
    }),
  ],
};
