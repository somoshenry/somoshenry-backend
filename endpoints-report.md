# Informe de Endpoints (detalle de campos)

Generado heurísticamente. Verifica manualmente los casos complejos.

---
### AppController
**Archivo origen:** `src\app.controller.ts`
**Ruta:** `/`
**Método HTTP:** `GET`
**Descripción breve:** `getHello`
**Middleware o decoradores:** nestjs, Controller, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** string

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/me`
**Método HTTP:** `GET`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** ApiTags, Controller, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/me`
**Método HTTP:** `PATCH`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Controller, Get, AuthProtected, applyDecorators, Req, Patch
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/)
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.findAll`
**Método HTTP:** `GET`
**Descripción breve:** `ApiQuery`
**Middleware o decoradores:** Patch, AuthProtected, applyDecorators, Req, Body, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/:id`
**Método HTTP:** `GET`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Query, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/:id`
**Método HTTP:** `PATCH`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Get, AuthProtected, applyDecorators, Param, Patch
**Body esperado (DTO):**
- DTO: `UpdateUserDto` (definido en `src\modules\user\dto\update-user.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/:id`
**Método HTTP:** `DELETE`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Req, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/restore/:id`
**Método HTTP:** `PATCH`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Param, Req, Patch
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### UserController
**Archivo origen:** `src\modules\user\user.controller.ts`
**Ruta:** `/users/hard/:id`
**Método HTTP:** `DELETE`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Patch, AuthProtected, applyDecorators, Param, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/)
  @GetPostsFeedDocs(`
**Método HTTP:** `GET`
**Descripción breve:** `findAll`
**Middleware o decoradores:** HttpPost, AuthProtected, CreatePostDocs, Body, Req, Get, GetPostsFeedDocs
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/:id`
**Método HTTP:** `GET`
**Descripción breve:** `GetPostByIdDocs`
**Middleware o decoradores:** Get, GetPostsFeedDocs, Query
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/:id`
**Método HTTP:** `PATCH`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Get, GetPostsFeedDocs, Query, GetPostByIdDocs, Param, Patch
**Body esperado (DTO):**
- DTO: `UpdatePostDto` (definido en `src\modules\post\dto\update-post.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/:id`
**Método HTTP:** `DELETE`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Patch, AuthProtected, UpdatePostDocs, Param, Body, Req, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/:id/unlike`
**Método HTTP:** `DELETE`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** HttpPost, AuthProtected, Param, Req, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### PostController
**Archivo origen:** `src\modules\post\post.controller.ts`
**Ruta:** `/posts/:id/likes`
**Método HTTP:** `GET`
**Descripción breve:** `getLikesCount`
**Middleware o decoradores:** Delete, AuthProtected, Param, Req, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- id: string — requerido
**Respuesta esperada:** indeterminado

---
### GmailController
**Archivo origen:** `src\modules\gmail\gmail.controller.ts`
**Ruta:** `/email/send`
**Método HTTP:** `POST`
**Descripción breve:** `applyDecorators`
**Middleware o decoradores:** nestjs, Controller, Post
**Body esperado (DTO):**
- DTO: `GmailDataDto` (definido en `src\modules\gmail\dto\gmail.data.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/:idSeguido`
**Método HTTP:** `POST`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** nestjs, ApiTags, Controller, Post
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/unfollow/:idSeguido`
**Método HTTP:** `DELETE`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Param, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/remove-follower/:idSeguidor`
**Método HTTP:** `DELETE`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/seguidores/:idUsuario`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<User[]>

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/siguiendo/:idUsuario`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Get, ApiOperation, ApiResponse, Param
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<User[]>

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/seguidores/:idUsuario/count`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Get, ApiOperation, ApiResponse, Param
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### FollowController
**Archivo origen:** `src\modules\follow\follow.controller.ts`
**Ruta:** `/follows/siguiendo/:idUsuario/count`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** ApiResponse, Param, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/uploadPostFile/:postId`
**Método HTTP:** `PUT`
**Descripción breve:** `UseInterceptors`
**Middleware o decoradores:** nestjs, ApiTags, Controller, Put
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/uploadProfilePicture/:userId`
**Método HTTP:** `PUT`
**Descripción breve:** `UseInterceptors`
**Middleware o decoradores:** Param, Put
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/uploadCoverPicture/:userId`
**Método HTTP:** `PUT`
**Descripción breve:** `UseInterceptors`
**Middleware o decoradores:** Param, Put
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/deletePostFile/:postId`
**Método HTTP:** `DELETE`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Param, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/deleteUserProfilePicture/:userId`
**Método HTTP:** `DELETE`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Delete, ApiOperation, ApiResponse, Param
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### FilesController
**Archivo origen:** `src\modules\files\files.controller.ts`
**Ruta:** `/files/deleteUserCoverPicture/:userId`
**Método HTTP:** `DELETE`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Delete, ApiOperation, ApiResponse, Param
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/post/:postId`
**Método HTTP:** `POST`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** ApiTags, Controller, Post
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment>

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/post/:postId/comments`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Param, Body, Req, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment[]>

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/:id`
**Método HTTP:** `GET`
**Descripción breve:** `ApiOperation`
**Middleware o decoradores:** Get, ApiOperation, ApiResponse, Param
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment>

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/:id`
**Método HTTP:** `PATCH`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Get, ApiOperation, ApiResponse, Param, Patch
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment>

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/:id`
**Método HTTP:** `DELETE`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** Param, Body, Req, Delete
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment>

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/:id/like`
**Método HTTP:** `POST`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** ApiOperation, ApiResponse, Param, Req, Post
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<

---
### CommentController
**Archivo origen:** `src\modules\comment\comment.controller.ts`
**Ruta:** `/comment/:commentId/reply`
**Método HTTP:** `POST`
**Descripción breve:** `AuthProtected`
**Middleware o decoradores:** ApiOperation, ApiResponse, Param, Req, Post
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** Promise<Comment>

---
### AuthController
**Archivo origen:** `src\modules\auth\auth.controller.ts`
**Ruta:** `/auth/register`
**Método HTTP:** `POST`
**Descripción breve:** `applyDecorators`
**Middleware o decoradores:** ApiTags, Controller, Post
**Body esperado (DTO):**
- DTO: `CreateUserDto` (definido en `src\modules\user\dto\create-user.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### AuthController
**Archivo origen:** `src\modules\auth\auth.controller.ts`
**Ruta:** `/auth/login`
**Método HTTP:** `POST`
**Descripción breve:** `applyDecorators`
**Middleware o decoradores:** ApiTags, Controller, Post, applyDecorators, Body
**Body esperado (DTO):**
- DTO: `CredentialDto` (definido en `src\modules\auth\dto\credential.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### AuthController
**Archivo origen:** `src\modules\auth\auth.controller.ts`
**Ruta:** `/auth/update-password`
**Método HTTP:** `POST`
**Descripción breve:** `applyDecorators`
**Middleware o decoradores:** Post, applyDecorators, Body
**Body esperado (DTO):**
- DTO: `CredentialDto` (definido en `src\modules\auth\dto\credential.dto.ts`)
  - (No se detectaron propiedades en el DTO)
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### AuthGoogleController
**Archivo origen:** `src\modules\auth\auth-google.controller.ts`
**Ruta:** `/auth/google`
**Método HTTP:** `GET`
**Descripción breve:** `applyDecorators`
**Middleware o decoradores:** Controller, Get
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
### AuthGoogleController
**Archivo origen:** `src\modules\auth\auth-google.controller.ts`
**Ruta:** `/auth/google/callback`
**Método HTTP:** `GET`
**Descripción breve:** `UseGuards`
**Middleware o decoradores:** Controller, Get, applyDecorators, UseGuards
**Body esperado (DTO):**
- No aplica
**Query params:**
- No hay query params
**Params (ruta):**
- No hay params
**Respuesta esperada:** indeterminado

---
