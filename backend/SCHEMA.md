# Backend - Schema Prisma y Setup

## Información General

Este backend implementa la estructura de base de datos para un AirDrop con cálculo de tokens basado en puntos.

### Pool inicial: 10.000.000 $VELX

---

## Modelos de Datos

### 1. **User**
- `id`: UUID único
- `email`: Único
- `name`: Nombre del usuario
- `password`: Hash de contraseña
- `role`: ADMIN o USER
- `points`: Puntos acumulados (default: 0)
- `timestamps`: createdAt, updatedAt

### 2. **Task**
- `id`: UUID único
- `title`: Nombre de la tarea
- `description`: Descripción opcional
- `points`: Puntos que otorga
- `deadline`: Fecha límite opcional
- `active`: Si está activa (default: true)
- `timestamps`: createdAt, updatedAt

### 3. **UserTask** (Relación M:M)
- `id`: UUID único
- `userId`: FK a User
- `taskId`: FK a Task
- `status`: PENDING, COMPLETED, FAILED
- `pointsAwarded`: Puntos otorgados al completar
- `completedAt`: Fecha de completación
- `timestamps`: createdAt, updatedAt
- Constraint: unique(userId, taskId)

### 4. **AirdropConfig**
- `id`: UUID único
- `totalAirdropPool`: Pool total de tokens (DECIMAL)
- `totalCommunityPoints`: Total de puntos de la comunidad
- `startDate`: Inicio del airdrop
- `endDate`: Fin del airdrop
- `isActive`: Si está activo (default: true)
- `timestamps`: createdAt, updatedAt

### 5. **SystemSettings**
- `id`: UUID único
- `maintenanceMode`: Modo mantenimiento (default: false)
- `maxTasksPerUser`: Máximo de tareas por usuario (default: 15)
- `tokenSymbol`: Símbolo del token (default: VELX)
- `defaultTaskDuration`: Duración por defecto en días (default: 7)
- `timestamps`: createdAt, updatedAt

---

## Enums

### UserRole
- `ADMIN` - Administrador
- `USER` - Usuario normal

### UserTaskStatus
- `PENDING` - Tarea pendiente
- `COMPLETED` - Tarea completada
- `FAILED` - Tarea fallida

---

## Cálculo de Tokens Estimados

```
estimatedTokens = (userPoints / totalCommunityPoints) * totalAirdropPool
```

Ejemplo:
- User1: 680 puntos
- Total comunidad: 5020 puntos
- Pool: 10.000.000 $VELX

```
User1 tokens = (680 / 5020) * 10000000 = 1,354,581.75 $VELX
```

---

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/airdrop"
PORT=4000
NODE_ENV=development
```

### 3. Correr migraciones
```bash
npx prisma migrate dev --name init
```

### 4. Ejecutar seed (poblar datos demo)
```bash
npm run seed
```

### 5. Generar Prisma Client
```bash
npx prisma generate
```

---

## Datos de Seed

### Usuarios (1 admin + 5 demo)
- **admin@airdrop.local** (1500 puntos, ADMIN)
- demo1@airdrop.local (680 puntos)
- demo2@airdrop.local (940 puntos)
- demo3@airdrop.local (420 puntos)
- demo4@airdrop.local (820 puntos)
- demo5@airdrop.local (560 puntos)

**Total: 5420 puntos**

### Tareas (12 tareas)
1. Crear perfil de usuario (120 pts, 14 días)
2. Compartir la app en redes (180 pts, 7 días)
3. Invitar a 3 amigos (220 pts, 30 días)
4. Completar tutorial (90 pts, 10 días)
5. Reportar un bug (200 pts, 21 días)
6. Participar en encuesta (70 pts, 7 días)
7. Configurar autenticación (150 pts, 14 días)
8. Escribir reseña (130 pts, 30 días)
9. Proponer una mejora (160 pts, 21 días)
10. Ver el roadmap (80 pts, 14 días)
11. Completar un desafío (250 pts, 30 días)
12. Subir avatar (60 pts, 7 días)

### Relaciones UserTask
- 12 tareas completadas repartidas entre usuarios
- Cada usuario completó entre 2-3 tareas

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Seed
npm run seed

# Prisma CLI
npm run prisma
```

---

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma (definición de modelos)
│   ├── seed.ts (datos iniciales)
│   └── migrations/
│       └── 0_init/
│           └── migration.sql
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   │   ├── healthService.ts
│   │   └── tokenService.ts (cálculo de tokens)
│   ├── middleware/
│   └── utils/
└── package.json
```

---

## Notas

- Las contraseñas en el seed son **plaintext** (no usar en producción)
- El cálculo de tokens se realiza en tiempo real consultando `totalCommunityPoints`
- Prisma v7+ usa DECIMAL para manejar números grandes sin perder precisión
