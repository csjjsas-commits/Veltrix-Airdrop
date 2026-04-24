# Sistema de Verificación de Tareas

## 📋 Resumen

El sistema de verificación permite validar automáticamente el cumplimiento de tareas sociales y blockchain, eliminando la necesidad de revisiones manuales para acciones verificables.

## 🔧 Arquitectura

### Backend

#### Servicios de Verificación
- `src/services/verification/` - Servicios especializados por plataforma
- `src/services/verificationService.ts` - Orquestador principal
- `src/services/verification/types.ts` - Interfaces y tipos

#### Tipos de Verificación Soportados

| Tipo | Descripción | Datos Requeridos |
|------|-------------|------------------|
| `TWITTER_FOLLOW` | Seguir cuenta | `targetUserId`, `username` |
| `TWITTER_LIKE` | Dar like a tweet | `tweetId` |
| `TWITTER_RETWEET` | Retuitear | `tweetId` |
| `DISCORD_JOIN` | Unirse a servidor | `serverId` |
| `DISCORD_ROLE` | Verificar rol | `serverId`, `roleId` |
| `TELEGRAM_JOIN_CHANNEL` | Unirse a canal | `channelId` |
| `TELEGRAM_JOIN_GROUP` | Unirse a grupo | `groupId` |
| `TELEGRAM_BOT_VERIFY` | Verificación con bot | - |
| `WALLET_CONNECT` | Conectar wallet | - |
| `WALLET_HOLD_TOKEN` | Balance mínimo | `contractAddress`, `amount` |
| `WALLET_NFT_OWNERSHIP` | Propiedad NFT | `contractAddress`, `tokenId` |
| `WALLET_TRANSACTION` | Verificar transacción | `txHash` |

#### API Endpoints

```
POST /api/tasks/:id/verify
```

**Request Body:**
```json
{
  "verificationType": "TWITTER_FOLLOW",
  "verificationData": {
    "username": "usuario"
  },
  "userMetadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Seguimiento verificado exitosamente!",
  "data": {
    "verified": true,
    "taskCompleted": true,
    "externalId": "usuario",
    "metadata": {...}
  }
}
```

### Base de Datos

#### Nuevos Campos en `Task`
- `verificationType: TaskVerificationType` - Tipo de verificación
- `verificationData: Json` - Configuración específica

#### Nuevos Campos en `UserTask`
- `verificationMetadata: Json` - Datos de verificación
- `lastCheckedAt: DateTime` - Última verificación
- `externalId: String` - ID externo (username, wallet, etc.)

### Frontend

#### Componentes
- `VerificationButton` - Botón genérico de verificación
- `TaskCard` actualizado - Muestra botones apropiados

#### Flujo de Verificación

1. **Usuario hace clic en "Verificar"**
2. **Prompt para datos** (username, wallet address, etc.)
3. **API call** a `/api/tasks/:id/verify`
4. **Actualización en tiempo real** del estado de la tarea

## 🔐 Configuración de APIs

### Variables de Entorno (`.env`)

```env
# Twitter API v2
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Wallet/Blockchain
WALLET_RPC_URL=https://mainnet.infura.io/v3/your_key
WALLET_CHAIN_ID=1
```

### Implementación de APIs Reales

#### Twitter API v2
```typescript
// Verificar seguimiento
GET https://api.twitter.com/2/users/:source_user_id/following

// Verificar like
GET https://api.twitter.com/2/tweets/:id/liking_users

// Verificar retweet
GET https://api.twitter.com/2/tweets/:id/retweeted_by
```

#### Discord API
```typescript
// Verificar membresía
GET https://discord.com/api/guilds/{guild.id}/members/{user.id}
```

#### Telegram Bot API
```typescript
// Verificar membresía en canal/grupo
GET https://api.telegram.org/bot{token}/getChatMember
```

#### Blockchain RPC
```typescript
// Verificar balance ERC-20
eth_call to contract.balanceOf(address)

// Verificar ownership NFT
eth_call to contract.ownerOf(tokenId)
```

## 🎯 Flujo de Verificación

### 1. Creación de Tarea
```typescript
const task = await prisma.task.create({
  data: {
    title: 'Seguir en Twitter',
    verificationType: 'TWITTER_FOLLOW',
    verificationData: {
      targetUserId: '1234567890',
      username: 'AirDropProject'
    }
  }
});
```

### 2. Verificación por Usuario
```typescript
// Usuario ingresa username
const username = prompt('Username de Twitter:');

// API call
const result = await fetch(`/api/tasks/${taskId}/verify`, {
  method: 'POST',
  body: JSON.stringify({
    verificationType: 'TWITTER_FOLLOW',
    verificationData: { username }
  })
});
```

### 3. Procesamiento Backend
```typescript
// VerificationService.verifyTask()
const provider = VerificationProviderRegistry.getProvider(type);
const result = await provider.verify(userId, taskId, data);

// Si éxito: actualizar UserTask y puntos
if (result.success) {
  await prisma.userTask.update({
    where: { userId_taskId: { userId, taskId } },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points,
      externalId: result.externalId
    }
  });
}
```

## 🧪 Testing

### Mocks Funcionales
Sin APIs reales configuradas, el sistema usa mocks con ~70% tasa de éxito para testing.

### Testing Manual
```bash
# Verificar Twitter follow
curl -X POST http://localhost:4000/api/tasks/:id/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"verificationType":"TWITTER_FOLLOW","verificationData":{"username":"test"}}'
```

## 📈 Métricas y Monitoreo

### Logs de Verificación
```typescript
logger.info('Verification attempt', {
  userId,
  taskId,
  type: verificationType,
  success: result.success,
  externalId: result.externalId
});
```

### Estadísticas
- Tasa de éxito por tipo de verificación
- Tiempo promedio de verificación
- Errores por plataforma

## 🚀 Producción

### Checklist de Despliegue
- [ ] Configurar APIs reales
- [ ] Probar rate limits
- [ ] Configurar monitoring
- [ ] Documentar procesos de soporte
- [ ] Crear tareas de ejemplo

### Escalabilidad
- Cache de verificaciones recientes
- Queue para verificaciones pesadas
- Rate limiting por usuario/API
- Fallback a verificación manual

## 🔧 Mantenimiento

### Agregar Nuevo Tipo de Verificación
1. Agregar enum en `TaskVerificationType`
2. Crear servicio en `verification/`
3. Registrar en `VerificationProviderRegistry`
4. Actualizar frontend `VerificationButton`
5. Agregar tests

### Actualizar APIs
- Monitorear límites de rate
- Rotar tokens/API keys
- Actualizar versiones de API
- Manejar deprecations