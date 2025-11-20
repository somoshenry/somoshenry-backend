# Password Recovery / Recuperación de Contraseña

## Descripción

Módulo completo de recuperación de contraseña para Somos Henry. Permite a los usuarios solicitar un enlace por email para recuperar su contraseña de forma segura.

## Características

- ✅ Generación segura de tokens aleatorios (crypto.randomBytes)
- ✅ Almacenamiento seguro: solo se guarda el hash del token en BD
- ✅ Tokens con expiración (30 minutos)
- ✅ Prevención de reutilización de tokens
- ✅ Integración con GmailService para envío de emails
- ✅ Interfaz segura: no revela si un email existe o no
- ✅ Validación de contraseña fuerte

## Flujo de Recuperación

### 1. Usuario solicita recuperación (POST /auth/forgot-password)

```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña."
}
```

**¿Qué ocurre internamente?**

1. Se busca el usuario por email
2. Se genera un token aleatorio de 64 caracteres (32 bytes hex)
3. Se hashea el token con bcrypt
4. Se guarda en BD con:
   - Timestamp de creación
   - Expiración: 30 minutos desde ahora
   - Flag `used: false`
5. Se envía email con enlace:
   ```
   https://<FRONTEND_URL>/reset-password?token=<TOKEN_CRUDO>
   ```

**Nota de seguridad:** Por seguridad, siempre devuelve el mismo mensaje, incluso si el email no existe.

---

### 2. Usuario hace clic en el enlace del email

El usuario recibe un email con el link:

```
https://somoshenry.vercel.app/reset-password?token=a1b2c3d4e5f6...
```

---

### 3. Frontend recopila nueva contraseña

El frontend debe:

1. Extraer el token de la URL (`?token=...`)
2. Pedir al usuario una nueva contraseña
3. Validar que cumpla requisitos (8+ caracteres, mayúscula, minúscula, número)

---

### 4. Usuario envía nueva contraseña (POST /auth/reset-password)

```bash
POST /auth/reset-password
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NuevaPassword123"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Tu contraseña ha sido actualizada exitosamente"
}
```

**Respuesta error (token expirado):**

```json
{
  "statusCode": 400,
  "message": "El token ha expirado"
}
```

**Respuesta error (token usado):**

```json
{
  "statusCode": 400,
  "message": "Este token ya ha sido utilizado"
}
```

---

## Implementación Técnica

### Archivos Nuevos Creados

```
src/modules/auth/
├── entities/
│   └── password-reset-token.entity.ts      # Nueva entidad TypeORM
├── dto/
│   ├── forgot-password.dto.ts              # Request DTO
│   ├── reset-password.dto.ts               # Request DTO
│   └── password-reset-email-template.dto.ts # Template HTML
├── password-reset.service.ts               # Servicio con lógica
├── password-reset.controller.ts            # Controlador con endpoints
└── auth.module.ts                          # Actualizado para incluir lo nuevo
```

### Cambios a Archivos Existentes

Solo se modificó `auth.module.ts` para:

1. Importar `TypeOrmModule.forFeature([PasswordResetToken, User])`
2. Importar `GmailModule`
3. Agregar `PasswordResetController` a los controladores
4. Agregar `PasswordResetService` a los providers
5. Exportar `PasswordResetService`

**No se modificó:**

- AuthService
- AuthController
- Estrategia JWT
- Ningún otro módulo

---

## Seguridad

### Protecciones Implementadas

1. **Hash de tokens:** Solo se guarda bcrypt(token) en BD, nunca el token crudo
2. **Expiración:** Tokens válidos solo por 30 minutos
3. **Uso único:** Cada token puede usarse una única vez
4. **Email seguro:** No revela si el email existe o no (importante para prevenir enumeración)
5. **Contraseña fuerte:** Validación con class-validator
6. **No se modifica JWT:** El JWT de autenticación sigue siendo independiente

### Consideraciones de Implementación

- Los tokens se generan con `crypto.randomBytes(32)` → 64 caracteres hex
- Se hashean con bcrypt saltRounds: 10 (por consistencia con contraseñas)
- Se almacenan en tabla separada `password_reset_tokens` con FK a `users`
- Expiración: 30 minutos (configurable en `tokenExpirationMinutes`)

---

## Configuración Necesaria

Asegúrate de que en `.env` esté configurado:

```env
FRONTEND_URL=https://somoshenry.vercel.app
GMAIL_CLIENT_ID=<tu-id>
GMAIL_CLIENT_SECRET=<tu-secret>
GMAIL_REFRESH_TOKEN=<tu-refresh-token>
GMAIL_USER_EMAIL=<tu-email>
JWT_SECRET=<tu-secret>
```

---

## Frontend - Componente Ejemplo

```typescript
// pages/forgot-password.tsx
import { useState } from 'react';
import { api } from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Solicitar Recuperación'}
      </button>
      {success && <p>Revisa tu email para las instrucciones</p>}
    </form>
  );
}
```

```typescript
// pages/reset-password.tsx
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <p>Token inválido o faltante</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : 'Resetear Contraseña'}
      </button>
      {success && <p style={{ color: 'green' }}>¡Contraseña actualizada! Redirigiendo...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

---

## Testing

### Con cURL

```bash
# 1. Solicitar recuperación
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com"}'

# 2. Resetear contraseña (con token recibido por email)
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "newPassword": "NuevaPassword123"
  }'
```

### Con Postman

1. **Forgot Password**
   - Método: POST
   - URL: `http://localhost:3000/auth/forgot-password`
   - Body (JSON):
     ```json
     {
       "email": "test@ejemplo.com"
     }
     ```

2. **Reset Password**
   - Método: POST
   - URL: `http://localhost:3000/auth/reset-password`
   - Body (JSON):
     ```json
     {
       "token": "<token-from-email>",
       "newPassword": "NuevaPassword123"
     }
     ```

---

## Validación de Contraseña

Las contraseñas deben cumplir:

- ✅ Mínimo 8 caracteres
- ✅ Máximo 32 caracteres
- ✅ Al menos una letra mayúscula
- ✅ Al menos una letra minúscula
- ✅ Al menos un número

Ejemplos válidos:

- `MyPassword123`
- `SecurePass2024`
- `Reset@Pass99`

Ejemplos inválidos:

- `short1` (muy corta)
- `NOPASSWORD123` (sin minúsculas)
- `nopassword123` (sin mayúsculas)
- `NoPassword` (sin números)

---

## Limpieza de Tokens Expirados

Opcionalmente, puedes crear un trabajo programado para limpiar tokens expirados:

```typescript
// En un módulo con @nestjs/schedule
@Cron(CronExpression.EVERY_HOUR)
async cleanupExpiredTokens() {
  const result = await this.passwordResetService.cleanupExpiredTokens();
  console.log(`${result.deletedCount} tokens expirados eliminados`);
}
```

---

## Problemas Comunes

### No recibo el email

1. Verifica que GMAIL está configurado correctamente en `.env`
2. Revisa los logs del servidor: busca "Error enviando email"
3. Verifica que el correo Gmail tiene habilitada la API

### Token expirado

- Los tokens expiran en 30 minutos
- Solicita uno nuevo si expiró

### Contraseña rechazada

- Verifica que cumple los requisitos
- Al menos: 8 caracteres, mayúscula, minúscula, número

---

## Integración Futura

Este módulo está diseñado para ser extensible:

- Añadir más validaciones de contraseña
- Integrar con sistemas de 2FA
- Agregar logs de auditoría
- Implementar rate limiting en endpoints
- Agregar eventos de dominio (password.reset.completed)

---

**Creado:** 2024
**Última actualización:** Noviembre 2024
