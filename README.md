# SomosHenry Backend

API REST para la red social educativa SomosHenry. Sistema completo de gestión de usuarios, publicaciones, comentarios, chat en tiempo real y notificaciones.

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación API](#documentación-api)
- [Endpoints Principales](#endpoints-principales)
- [Testing](#testing)
- [Scripts Disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)

## Tecnologías

| Categoría      | Tecnología             |
| -------------- | ---------------------- |
| Framework      | NestJS 11.x            |
| ORM            | TypeORM 0.3.x          |
| Base de Datos  | PostgreSQL             |
| Autenticación  | JWT + Google OAuth 2.0 |
| WebSockets     | Socket.io              |
| Almacenamiento | Cloudinary             |
| Pagos          | MercadoPago API        |
| Documentación  | Swagger/OpenAPI        |

## Requisitos Previos

- **Node.js** 18 o superior
- **npm** o **yarn**
- **PostgreSQL** 14 o superior
- Cuenta en **Cloudinary** para almacenamiento de archivos
- Credenciales de **Google OAuth** (opcional, para login social)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/somoshenry/somoshenry-backend.git
cd somoshenry-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales correspondientes

# Crear base de datos
createdb somoshenry
```

## Configuración

### Variables de Entorno

Crear un archivo `.env` basado en `.env.example` y completar:

**Base de Datos:**

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DATABASE_URL` (para producción en Render)

**Autenticación:**

- `JWT_SECRET` - Generar con:

```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `JWT_EXPIRES_IN` (por defecto: 7d)

**Servicios Externos:**

- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Gmail API: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- MercadoPago: `MERCADOPAGO_ACCESS_TOKEN`

**URLs:**

- `FRONTEND_URL` - URL del frontend
- `BACKEND_URL` - URL del backend

Ver `.env.example` para la lista completa.

## Ejecución

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod

# Cargar datos de prueba en la base de datos
npm run seed
```

## Estructura del Proyecto

```
src/
├── modules/
│   ├── auth/              # Autenticación JWT y Google OAuth
│   ├── user/              # Gestión de usuarios y perfiles
│   ├── post/              # Publicaciones, likes y dislikes
│   ├── comment/           # Comentarios y respuestas anidadas
│   ├── follow/            # Sistema de seguimiento entre usuarios
│   ├── chat/              # Mensajería en tiempo real (WebSocket)
│   ├── notifications/     # Notificaciones push en tiempo real
│   ├── files/             # Carga de imágenes y videos a Cloudinary
│   ├── report/            # Sistema de reportes de contenido
│   ├── dashboard/         # Panel administrativo y estadísticas
│   ├── gmail/             # Envío de emails con Gmail API
│   └── mercadopago/       # Integración de pagos
├── common/
│   ├── interceptors/      # Interceptores globales (audit, eventos)
│   ├── guards/            # Guards de autorización y roles
│   ├── events/            # Sistema de eventos de dominio
│   └── utils/             # Utilidades y helpers compartidos
├── config/                # Configuraciones (TypeORM, Cloudinary, etc.)
└── main.ts               # Punto de entrada de la aplicación
```

## Documentación API

La documentación interactiva de la API está disponible con Swagger:

- **Desarrollo:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Producción:** `https://your-domain.com/docs`

## Endpoints Principales

### Autenticación

| Método | Endpoint                | Descripción            | Auth |
| ------ | ----------------------- | ---------------------- | ---- |
| POST   | `/auth/register`        | Registro de usuarios   | No   |
| POST   | `/auth/login`           | Login con credenciales | No   |
| GET    | `/auth/google`          | Login con Google OAuth | No   |
| POST   | `/auth/update-password` | Actualizar contraseña  | No   |

### Usuarios

| Método | Endpoint     | Descripción                    | Auth |
| ------ | ------------ | ------------------------------ | ---- |
| GET    | `/users/me`  | Perfil del usuario autenticado | Sí   |
| PATCH  | `/users/me`  | Actualizar perfil propio       | Sí   |
| GET    | `/users`     | Lista de usuarios con filtros  | Sí   |
| GET    | `/users/:id` | Obtener usuario por ID         | Sí   |

### Publicaciones

| Método | Endpoint             | Descripción                    | Auth |
| ------ | -------------------- | ------------------------------ | ---- |
| POST   | `/posts`             | Crear publicación              | Sí   |
| GET    | `/posts`             | Feed con filtros y paginación  | Sí   |
| GET    | `/posts/:id`         | Obtener publicación específica | No   |
| PATCH  | `/posts/:id`         | Actualizar publicación         | Sí   |
| DELETE | `/posts/:id`         | Eliminar publicación           | Sí   |
| POST   | `/posts/:id/like`    | Dar like                       | Sí   |
| DELETE | `/posts/:id/unlike`  | Quitar like                    | Sí   |
| POST   | `/posts/:id/dislike` | Dar dislike                    | Sí   |

### Comentarios

| Método | Endpoint                    | Descripción                         | Auth |
| ------ | --------------------------- | ----------------------------------- | ---- |
| POST   | `/comment/post/:postId`     | Comentar en un post                 | Sí   |
| POST   | `/comment/:commentId/reply` | Responder a un comentario           | Sí   |
| GET    | `/post/:postId/comments`    | Obtener comentarios de un post      | No   |
| POST   | `/comment/:id/like`         | Dar like a un comentario            | Sí   |
| GET    | `/comment/:id/thread`       | Obtener hilo completo de respuestas | No   |

### Seguimientos

| Método | Endpoint                         | Descripción         | Auth |
| ------ | -------------------------------- | ------------------- | ---- |
| POST   | `/follows/:idSeguido`            | Seguir a un usuario | Sí   |
| DELETE | `/follows/unfollow/:idSeguido`   | Dejar de seguir     | Sí   |
| GET    | `/follows/seguidores/:idUsuario` | Obtener seguidores  | No   |
| GET    | `/follows/siguiendo/:idUsuario`  | Obtener seguidos    | No   |

### Chat

| Método | Endpoint                           | Descripción                 | Auth |
| ------ | ---------------------------------- | --------------------------- | ---- |
| POST   | `/chat/conversations`              | Abrir conversación          | Sí   |
| GET    | `/chat/conversations`              | Listar conversaciones       | Sí   |
| GET    | `/chat/conversations/:id/messages` | Obtener mensajes            | Sí   |
| POST   | `/chat/messages`                   | Enviar mensaje de texto     | Sí   |
| POST   | `/chat/messages/files`             | Enviar mensaje con archivos | Sí   |

### Notificaciones

| Método | Endpoint                  | Descripción                        | Auth |
| ------ | ------------------------- | ---------------------------------- | ---- |
| GET    | `/notifications`          | Obtener notificaciones del usuario | Sí   |
| PATCH  | `/notifications/:id/read` | Marcar como leída                  | Sí   |
| PATCH  | `/notifications/read-all` | Marcar todas como leídas           | Sí   |
| DELETE | `/notifications/:id`      | Eliminar notificación              | Sí   |

### Archivos

| Método | Endpoint                              | Descripción              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| PUT    | `/files/uploadPostFile/:postId`       | Subir archivo a un post  | Sí   |
| PUT    | `/files/uploadProfilePicture/:userId` | Subir foto de perfil     | Sí   |
| PUT    | `/files/uploadCoverPicture/:userId`   | Subir foto de portada    | Sí   |
| DELETE | `/files/deletePostFile/:postId`       | Eliminar archivo de post | Sí   |

## Testing

```bash
# Tests unitarios
npm run test

# Tests end-to-end
npm run test:e2e

# Cobertura de código
npm run test:cov

# Tests en modo watch
npm run test:watch
```

## Scripts Disponibles

| Script                | Descripción                        |
| --------------------- | ---------------------------------- |
| `npm run start`       | Iniciar en modo producción         |
| `npm run start:dev`   | Iniciar en desarrollo (watch mode) |
| `npm run start:debug` | Iniciar en modo debug              |
| `npm run build`       | Compilar para producción           |
| `npm run format`      | Formatear código con Prettier      |
| `npm run lint`        | Ejecutar ESLint y autofix          |
| `npm run test`        | Ejecutar tests                     |
| `npm run seed`        | Cargar datos de prueba en la BD    |

## Despliegue

El proyecto está configurado para desplegarse en **Render**:

1. Las variables de entorno se configuran en el panel de Render
2. `typeorm.config.ts` detecta automáticamente el entorno de producción
3. La variable `DATABASE_URL` se genera automáticamente en Render
4. Swagger estará disponible en `/docs`

### Configuración en Render

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`
- Agregar todas las variables de `.env.example` en Environment

---

## Licencia

MIT

## Autores

Equipo de desarrollo SomosHenry - Proyecto Final Henry Bootcamp 2025

---

**Documentación generada:** Noviembre 2025
