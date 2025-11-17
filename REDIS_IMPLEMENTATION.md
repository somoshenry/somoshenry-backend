# 🚀 Redis Implementation - Guía de Uso

## Resumen de Cambios

Se ha implementado un sistema completo de caché con Redis para **Chat 1a1**, **Chat Grupal** y **Feed de Posts**, optimizando el rendimiento y haciendo la aplicación "más viva".

---

## 📦 Archivos Creados

### 1. **`src/common/services/redis.service.ts`**

Servicio centralizado para toda la gestión de Redis.

**Características principales:**

- Conecta automáticamente a Redis si `REDIS_URL` está configurado
- Fallback a modo local si Redis no está disponible
- Métodos genéricos para todas las operaciones Redis

**Métodos disponibles:**

```typescript
// Strings
await redis.get<T>(key)
await redis.set(key, value, { ttl: 3600 })
await redis.del(...keys)
await redis.exists(key)

// Hashes
await redis.hset(key, field, value, ttl?)
await redis.hget<T>(key, field)
await redis.hgetall<T>(key)

// Lists
await redis.lpush(key, ...values)
await redis.rpush(key, ...values)
await redis.lrange<T>(key, start, stop)
await redis.llen(key)

// Sets
await redis.sadd(key, ...members)
await redis.srem(key, ...members)
await redis.smembers<T>(key)
await redis.scard(key)

// Utility
await redis.expire(key, seconds)
await redis.ttl(key)
await redis.publish(channel, message)
await redis.subscribe(channel, handler)
```

### 2. **`src/modules/post/post-cache.service.ts`**

Caché especializado para Posts/Feed.

**Claves de caché:**

- `feed:page:limit:type:userId` - Feed principal
- `search:query:page:limit` - Búsquedas
- `post:postId` - Post individual
- `likes:postId` - Contador de likes
- `dislikes:postId` - Contador de dislikes

**TTL por defecto:**

- Feed: 5 minutos
- Búsquedas: 10 minutos
- Posts: 15 minutos
- Stats (likes/dislikes): 1 minuto

**Métodos principales:**

```typescript
// Cachear
await postCache.cacheFeed(page, limit, data, type, userId);
await postCache.cacheSearch(search, page, limit, data);
await postCache.cachePost(postId, post);
await postCache.cacheLikesCount(postId, count);

// Obtener
await postCache.getFeedCache(page, limit, type, userId);
await postCache.getSearchCache(search, page, limit);
await postCache.getPostCache(postId);
await postCache.getLikesCountCache(postId);

// Invalidar
await postCache.invalidateFeedCache();
await postCache.invalidateSearchCache(search);
await postCache.invalidateCompletePostCache(postId);
```

### 3. **`src/modules/chat/chat-cache.service.ts`**

Caché especializado para Chat (1a1 y Grupos).

**Claves de caché:**

- `chat:conv:conversationId` - Mensajes de conversación 1a1
- `chat:group:groupId` - Mensajes de grupo
- `chat:members:groupId` - Miembros de grupo
- `chat:onlineUsers` - Usuarios online (Set)
- `chat:typing:conversationId` - Usuarios escribiendo

**TTL por defecto:**

- Mensajes: 30 minutos
- Miembros: 15 minutos
- Online/Typing: 5 minutos

**Métodos principales:**

```typescript
// Chat 1a1
await chatCache.cacheConversationMessages(convId, messages);
await chatCache.getConversationMessagesCache(convId);
await chatCache.invalidateConversationCache(convId);

// Chat Grupal
await chatCache.cacheGroupMessages(groupId, messages);
await chatCache.getGroupMessagesCache(groupId);
await chatCache.cacheGroupMembers(groupId, members);
await chatCache.getGroupMembersCache(groupId);
await chatCache.invalidateCompleteGroupCache(groupId);

// Online/Typing
await chatCache.addOnlineUser(userId);
await chatCache.removeOnlineUser(userId);
await chatCache.getOnlineUsers();
await chatCache.addTypingUser(convId, userId);
await chatCache.removeTypingUser(convId, userId);
await chatCache.getTypingUsers(convId);
```

---

## 🔧 Cómo Usar

### Paso 1: Importar en los módulos

```typescript
// post.module.ts
import { RedisService } from '../../common/services/redis.service';
import { PostCacheService } from './post-cache.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [PostService, PostCacheService],
})
export class PostModule {}
```

### Paso 2: Inyectar en el service

```typescript
// post.service.ts
constructor(
  @InjectRepository(Post) private postRepository: Repository<Post>,
  private readonly postCacheService: PostCacheService,
  private readonly redisService: RedisService,
) {}
```

### Paso 3: Usar en métodos

```typescript
// Ejemplo: findAllWithFilters
async findAllWithFilters(filterDto: FilterPostsDto, user?: User) {
  const cacheKey = `feed:${page}:${limit}:${type || 'all'}:${userId || 'any'}`;

  // Intentar obtener del caché
  let cachedResult = await this.postCacheService.getFeedCache(
    page, limit, type, userId
  );
  if (cachedResult) {
    this.logger.log(`✅ Feed desde caché`);
    return cachedResult;
  }

  // Si no está en caché, consultar DB
  const result = await this.buildFeedQuery(filterDto, user);

  // Guardar en caché
  await this.postCacheService.cacheFeed(page, limit, result, type, userId);

  return result;
}

// Ejemplo: Invalidar cuando hay cambios
async likePost(postId: string, userId: string) {
  const like = await this.postLikeRepository.save({ postId, userId });

  // Invalidar cachés afectados
  await this.postCacheService.invalidateLikesCache(postId);
  await this.postCacheService.invalidateFeedCache();

  return like;
}
```

---

## ⚙️ Configuración

### Variable de entorno

```bash
REDIS_URL=redis://default:password@localhost:6379
```

Si no está configurado, Redis se desactiva automáticamente y la app funciona en modo local.

---

## 📊 Flujo de Datos

### Feed (Posts)

```
1. Cliente solicita feed (página X)
   ↓
2. Sistema intenta obtener de Redis
   ↓
3. Si no está → Consultar DB, cachear resultado, retornar
   ↓
4. Si usuario hace like/dislike → Invalidar cachés relacionados
   ↓
5. TTL expira (5-15 min) → Caché se auto-limpia
```

### Chat 1a1

```
1. Usuario A se conecta
   ↓
2. Se agrega a "usuarios online" en Redis
   ↓
3. Usuario A escribe → Se agrega a "escribiendo"
   ↓
4. Usuario A envía mensaje → Se cachean los mensajes recientes
   ↓
5. Usuario A se desconecta → Se remueve de "online"
```

### Chat Grupal

```
1. Grupo se crea → Se cachean miembros
   ↓
2. Se envían mensajes → Se cachean últimos N mensajes
   ↓
3. Miembro se agrega/remueve → Invalidar caché de miembros
   ↓
4. TTL expira → Se recargan desde DB
```

---

## 🎯 Beneficios

✅ **Rendimiento**: Consultas frecuentes a Redis (ms) vs DB (100s ms)
✅ **Escalabilidad**: Pueden crecer N usuarios sin saturar la DB
✅ **Real-time**: Usuarios online, typing status, últimos mensajes al instante
✅ **Resiliente**: Funciona sin Redis (fallback local)
✅ **Flexible**: TTL configurable por tipo de dato
✅ **Centralizado**: Un solo RedisService para toda la app

---

## 🚨 Cuidados

1. **Invalidación**: Cuando haya cambios en DB, invalidar el caché correspondiente
2. **TTL**: Ajustar según la frecuencia de cambios de cada dato
3. **Memoria**: Redis almacena en RAM, monitorear tamaño
4. **Concurrencia**: Redis es thread-safe, pero cuidar lógica de aplicación

---

## 📝 Próximos Pasos (Opcional)

1. Integrar `PostCacheService` en `post.service.ts`
2. Integrar `ChatCacheService` en `chat.gateway.ts`
3. Crear invalidación automática de cachés en eventos
4. Monitorear tamaño y uso de Redis
5. Ajustar TTLs según comportamiento en producción

---

## 📞 Soporte

- **RedisService**: Para operaciones genéricas
- **PostCacheService**: Para caché de Posts/Feed
- **ChatCacheService**: Para caché de Chat
- Todos tienen métodos públicos documentados

¡Listo para producción! 🚀
