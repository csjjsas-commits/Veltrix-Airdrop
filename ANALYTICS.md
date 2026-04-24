# AirDrop Analytics Implementation

## 🎯 Objetivo
Implementar analytics reales para entender comportamiento de usuarios y optimizar conversiones en la app AirDrop.

## 📊 Funcionalidades Implementadas

### 1. Google Analytics 4
- Tracking automático de páginas
- Eventos personalizados de usuario y tareas
- Configuración via variables de entorno

### 2. PostHog
- Analytics de producto avanzados
- Funnels y conversiones
- User identification y properties

### 3. Eventos Trackeados

#### Tráfico General
- ✅ Page views
- ✅ Sessions
- ✅ Users
- ✅ Traffic source

#### Funnel Principal
- ✅ Visit landing (page view)
- ✅ Click register (button click)
- ✅ Register completed (user_register event)
- ✅ Login completed (user_login event)
- ✅ First task completed (first_task_completed event)
- ✅ Multiple tasks completed (multiple_tasks_completed event)
- ✅ Return visit (return_visit event)

#### Engagement
- ✅ Tasks viewed (task_viewed event)
- ✅ Task completed (task_completed event)
- ✅ Task submit failed (task_failed event)
- ✅ Dashboard opened (dashboard_opened event)
- ✅ FAQ opened (faq_opened event)

#### Conversiones
- ✅ Signup conversion rate
- ✅ Task completion rate
- ✅ Repeat user rate

#### Referral (Listo para implementar)
- 🔄 Referral link opened
- 🔄 Referral signup
- 🔄 Referral conversion

### 4. Dashboard Admin
- ✅ Métricas básicas: usuarios totales, tareas completadas, tasa de conversión
- ✅ Top tasks por completion count
- ✅ Panel de analytics en tiempo real

## 🚀 Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# PostHog
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_HOST=https://app.posthog.com
```

### 2. Obtener API Keys

#### Google Analytics 4
1. Ir a [Google Analytics](https://analytics.google.com)
2. Crear propiedad GA4
3. Obtener Measurement ID (G-XXXXXXXXXX)

#### PostHog
1. Ir a [PostHog](https://app.posthog.com)
2. Crear proyecto
3. Obtener API Key desde Project Settings > Project Variables

### 3. Instalar Dependencias

```bash
# Frontend
cd frontend
npm install react-ga4 posthog-js

# Backend ya incluye las dependencias necesarias
```

### 4. Inicializar Base de Datos

La tabla `AnalyticsEvent` se crea automáticamente al iniciar el backend.

## 📈 Ver Métricas

### Google Analytics 4
- Dashboard: [Google Analytics](https://analytics.google.com)
- Métricas disponibles:
  - Usuarios activos
  - Páginas vistas
  - Eventos personalizados
  - Funnels de conversión

### PostHog
- Dashboard: [PostHog App](https://app.posthog.com)
- Métricas disponibles:
  - User journeys
  - Funnels
  - Retention analysis
  - A/B testing
  - Heatmaps

### Dashboard Admin (Local)
- URL: `http://localhost:5174/admin`
- Métricas mostradas:
  - Total users
  - Tasks completed
  - Conversion rate %
  - Top tasks

## 🔧 Archivos Creados/Modificados

### Frontend
```
frontend/src/
├── services/
│   └── analytics.ts                 # Servicio principal de analytics
├── components/
│   ├── analytics/
│   │   └── AnalyticsProvider.tsx    # Provider de React
│   └── admin/
│       └── AnalyticsDashboard.tsx   # Dashboard de métricas
├── hooks/
│   └── useAnalytics.ts             # Hook personalizado
└── pages/
    └── AdminPanel.tsx              # Actualizado con analytics
```

### Backend
```
backend/src/
├── services/
│   └── analyticsService.ts         # Servicio de métricas
├── controllers/
│   └── analyticsController.ts      # Controladores API
├── routes/
│   └── analytics.ts                # Rutas API
└── server.ts                       # Inicialización de tabla
```

### Base de Datos
- Nueva tabla: `AnalyticsEvent`
- Modelo agregado al schema Prisma

## 🧪 Probar Localmente

### 1. Iniciar Servicios
```bash
npm run dev
```

### 2. Verificar Analytics
1. Abrir app en `http://localhost:5174`
2. Registrarse y completar tareas
3. Ver eventos en:
   - Browser console (modo dev)
   - PostHog dashboard
   - Google Analytics (puede tomar tiempo)

### 3. Dashboard Admin
1. Ir a `http://localhost:5174/admin`
2. Ver métricas en tiempo real

## 🔒 Privacidad

- ✅ No se guardan datos sensibles
- ✅ User ID anonimizado
- ✅ Configuración via variables de entorno
- ✅ Solo métricas agregadas en dashboard admin

## 📋 Próximos Pasos

1. **Referral System**: Implementar tracking de referrals
2. **A/B Testing**: Framework para tests A/B
3. **Advanced Funnels**: Funnels más complejos
4. **Email Analytics**: Tracking de emails
5. **Push Notifications**: Analytics de notificaciones

## 🐛 Troubleshooting

### Error: "Cannot find module '../ui/Button'"
- Solución: El componente `Button` fue creado en `frontend/src/components/ui/Button.tsx`

### Error: "Analytics table doesn't exist"
- Solución: La tabla se crea automáticamente al iniciar el backend

### Google Analytics no recibe eventos
- Verificar `VITE_GA_MEASUREMENT_ID` en `.env`
- Esperar hasta 24 horas para que aparezcan datos

### PostHog no funciona
- Verificar `VITE_POSTHOG_API_KEY` y `VITE_POSTHOG_HOST`
- Revisar configuración en PostHog dashboard

## 📞 Soporte

Para issues relacionados con analytics:
1. Revisar configuración de variables de entorno
2. Verificar que las APIs keys sean válidas
3. Revisar logs del backend para errores de base de datos