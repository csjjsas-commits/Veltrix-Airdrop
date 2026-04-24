# AirDrop Full Stack

Proyecto full stack de AirDrop con React + TypeScript + Vite + Tailwind (frontend) y Node.js + Express + TypeScript + Prisma + PostgreSQL (backend).

## 🚀 Inicio rápido

### 1. Instalar dependencias
```bash
# Instalar todo (backend + frontend + raíz)
npm install

# O instalar por separado
npm run install:backend
npm run install:frontend
```

### 2. Configurar base de datos
```bash
# Ejecutar migraciones
npm run migrate

# Ejecutar seed (datos demo)
npm run seed

# Generar Prisma client
npm run generate
```

### 3. Ejecutar desarrollo
```bash
# Ejecutar backend + frontend simultáneamente
npm run dev

# O ejecutar por separado
npm run dev:backend  # Backend en http://localhost:4000
npm run dev:frontend # Frontend en http://localhost:5173
```

## 📁 Estructura del proyecto

```
Airdrop/
├── frontend/          # React + TypeScript + Vite + Tailwind
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── backend/           # Node.js + Express + TypeScript + Prisma
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── package.json       # Scripts del proyecto raíz
├── .gitignore
└── README.md
```

## 🛠️ Scripts disponibles

### Proyecto raíz
- `npm install` - Instalar todas las dependencias
- `npm run dev` - Ejecutar backend + frontend
- `npm run build` - Build de producción
- `npm run seed` - Ejecutar seed de datos
- `npm run migrate` - Ejecutar migraciones Prisma

### Backend (desde carpeta backend/)
- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm run start` - Ejecutar en producción
- `npm run prisma` - CLI de Prisma

### Frontend (desde carpeta frontend/)
- `npm run dev` - Desarrollo con Vite
- `npm run build` - Build de producción
- `npm run preview` - Preview del build

## 🔧 Configuración

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/airdrop"
PORT=4000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"
JWT_EXPIRE=7d
```

### Base de datos
- PostgreSQL
- Puerto: 5432
- Usuario: postgres
- Contraseña: postgres
- Base: airdrop

## 📊 Datos de seed

### Usuarios demo
- **admin@airdrop.local** (admin123) - Admin
- **demo1@airdrop.local** (demo123) - User
- **demo2@airdrop.local** (demo123) - User
- **demo3@airdrop.local** (demo123) - User
- **demo4@airdrop.local** (demo123) - User
- **demo5@airdrop.local** (demo123) - User

### Pool de tokens: 10.000.000 $VELX

## 🔐 API Endpoints

### Auth
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual (requiere auth)

### Health
- `GET /api/health` - Estado del servidor

## 🏗️ Tecnologías

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js + Express
- TypeScript
- Prisma + PostgreSQL
- JWT + bcrypt
- Zod (validaciones)

## 📝 Notas

- Las contraseñas en seed están hasheadas con bcrypt
- JWT expira en 7 días por defecto
- Base de datos debe estar corriendo en PostgreSQL