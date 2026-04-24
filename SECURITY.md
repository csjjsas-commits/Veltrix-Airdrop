# 🔐 Security Improvements - AirDrop App

## Mejoras implementadas para proteger usuarios reales

### 1. **Rate Limiting** ⚡
**Archivo:** `backend/src/middleware/rateLimiter.ts`

Limita solicitudes por IP para evitar ataques de fuerza bruta y spam:
- **Global:** 120 req/15 min (todas las rutas)
- **Auth (login):** 6 req/10 min
- **Register:** 4 req/60 min
- **Task Submit:** 6 req/5 min
- **Task Complete:** 8 req/60 seg

**Uso:**
```typescript
router.post('/login', authLimiter, verifyCaptcha, loginController);
```

---

### 2. **Anti-Spam & Cooldown** 🛡️
**Archivo:** `backend/src/middleware/cooldown.ts`

Previene múltiples envíos mediante cooldown global por usuario:
- **Todas las acciones POST en /api/tasks:** 30 segundos cooldown
- Reutilizable para cualquier endpoint

**Uso:**
```typescript
// Cooldown global aplicado a todas las rutas POST
router.post('/:id/complete', createCooldown(30 * 1000, 'Espera 30 segundos...'), completeTaskHandler);
router.post('/:id/submit', createCooldown(30 * 1000, 'Espera 30 segundos...'), submitTaskHandler);
router.post('/:id/verify', createCooldown(30 * 1000, 'Espera 30 segundos...'), verifyTaskHandler);
```

---

### 3. **CAPTCHA Cloudflare Turnstile** 🤖
**Archivos:**
- Backend: `backend/src/middleware/captcha.ts`
- Frontend: `frontend/src/components/captcha/TurnstileWidget.tsx`

Valida que el usuario es humano en registro/login:
- Integración en formularios de auth
- Verificación en backend
- Tema oscuro automático
- Token requerido en esquema Zod

**Configuración necesaria en `.env`:**
```env
TURNSTILE_SECRET_KEY=0x4AAAAAAADe...  # Backend secret
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...  # Frontend public key
```

**Obtener claves:** [Cloudflare Turnstile Console](https://dash.cloudflare.com/turnstile)

---

### 4. **Validación Fuerte con Zod** ✅
**Archivos:**
- `backend/src/schemas/authSchema.ts`
- `backend/src/schemas/taskSchema.ts`
- `backend/src/schemas/adminSchema.ts`

Validaciones mejoradas:
- ✅ Emails válidos (RFC5321)
- ✅ Contraseñas mínimo 8 caracteres
- ✅ Nombres y títulos: 2-255 caracteres
- ✅ Trimmed strings (sin espacios inicio/fin)
- ✅ Máximo 254 caracteres en emails
- ✅ Descripciones máximo 1000 caracteres
- ✅ Puntos máximo 10,000
- ✅ Sin campos vacíos

---

### 5. **Sanitización XSS** 🧹
**Archivo:** `backend/src/utils/sanitize.ts`

Limpia HTML/scripts de inputs del usuario:
```typescript
export const sanitizeString = (value: string): string => {
  return xss(value).trim();
};
```

Aplica automáticamente en:
- Nombres de usuario
- Títulos de tareas
- Descripciones
- Admin notes

---

### 6. **Protección JWT** 🔑
**Archivo:** `backend/src/services/authService.ts`

- **Expiración:** 15 minutos (configurable en `.env`)
- **Algo:** HS256
- **Verificación:** Middleware en todas las rutas protegidas
- **Manejo de errores:** Token inválido/vencido → 401

**Env recomendado:**
```env
JWT_SECRET=your-super-secure-random-secret-min-32-chars
JWT_EXPIRE=15m
```

---

### 7. **Error Logging Global** 📊
**Archivo:** `backend/src/middleware/errorHandler.ts`

Logs estructurados para debugging:
```
[Airdrop][ERROR] {
  message: string
  path: /api/tasks/...
  method: POST
  stack: error stack trace
}
```

Listo para integrar con **Sentry** sin cambios:
```typescript
Sentry.captureException(error);
```

---

### 8. **Backup PostgreSQL** 💾
**Archivo:** `backend/scripts/backup-db.ps1`

Script PowerShell para backups automáticos:
```bash
npm run backup
```

Genera: `backend/scripts/backups/backup-airdrop-YYYYMMDD-HHMMSS.sql`

**Backup automático (Windows Task Scheduler):**
```powershell
# Crear tarea que ejecute cada día a las 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AirdropDBBackup" `
  -Action (New-ScheduledTaskAction -Execute "powershell" `
    -Argument "-ExecutionPolicy Bypass -File C:\Users\Usuario\Desktop\Airdrop\backend\scripts\backup-db.ps1") `
  -Trigger $trigger
```

---

### 9. **Headers de Seguridad** 🔒
**Archivo:** `backend/src/app.ts`

**Helmet.js** agrega headers automáticos:
- `X-Content-Type-Options: nosniff` (previene MIME sniffing)
- `X-Frame-Options: DENY` (previene clickjacking)
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)

```typescript
app.use(helmet());
```

---

### 10. **Request Size Limits** 📦
**Archivo:** `backend/src/app.ts`

Limita tamaño de payloads a 10KB:
```typescript
app.use(express.json({ limit: '10kb' }));
```

---

## 📋 Configuración Completa `.env`

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/airdrop

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secure-random-secret-minimum-32-chars-long-please
JWT_EXPIRE=15m

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAAADe_abc123_xyzABC_...
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_def456_ABCxyz_...
```

---

## 🧪 Testing Local

### 1. **Backend**
```bash
cd backend
npm install
npm run build
npm run dev
# Server en http://localhost:4000
```

### 2. **Frontend**
```bash
cd frontend
npm install
npm run dev
# App en http://localhost:5173
```

### 3. **Probar Rate Limiting**
```bash
# Ejecuta 7 veces seguidas para ver límite en acción
for i in {1..7}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"password","captchaToken":"dummy"}'
  echo ""
done
# Respuesta 429 después de 6 intentos
```

### 4. **Probar Sanitización**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"<script>alert(1)</script>Test",
    "email":"test@example.com",
    "password":"SecurePass123",
    "captchaToken":"token"
  }'
# Name será sanitizado: "alert(1)Test"
```

### 5. **Probar CAPTCHA**
- Abre http://localhost:5173/login
- El widget de Turnstile aparece automáticamente
- Completa el desafío
- Token se envía automáticamente

---

## ⚙️ Variables de Entorno Frontend

Crear `.env.local` en `frontend/`:
```env
VITE_API_BASE=http://localhost:4000/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_def456_ABCxyz_...
```

---

## 🔄 Próximos Pasos (Opcional)

1. **Refresh Tokens:** Implementar tokens de 15m + refresh tokens de 7d
2. **Rate Limiting por ID:** Cambiar de IP a user ID para usuarios autenticados
3. **Audit Logs:** Guardar logs en DB para auditoría
4. **2FA:** Autenticación de dos factores para admins
5. **Sentry Integration:** `npm install @sentry/node` en backend
6. **CORS configurado:** Whitelist dominios en producción

---

## 📊 Checklist Pre-Producción

- [ ] `.env` completado con secretos seguros
- [ ] Turnstile claves configuradas
- [ ] Database URL apunta a PostgreSQL correcto
- [ ] Backups automáticos configurados
- [ ] JWT_SECRET min 32 caracteres, random
- [ ] NODE_ENV=production en servidor
- [ ] SSL/HTTPS habilitado (Nginx/Heroku/etc)
- [ ] CORS restringido a dominio real
- [ ] Logs monitoreados
- [ ] Rate limits ajustados según tráfico

---

## 🆘 Troubleshooting

**"CAPTCHA inválido"**
- Verificar TURNSTILE_SECRET_KEY en backend `.env`
- Verificar VITE_TURNSTILE_SITE_KEY en frontend `.env`
- Las claves son específicas por dominio

**"Demasiadas solicitudes"**
- Esperar 10 minutos para login/register
- Esperar 5 minutos para task submit

**"XSS Warning"**
- Revisar `sanitizeString()` en `backend/src/utils/sanitize.ts`
- Validar que se aplica en schémas

---

## 📚 Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Zod Validation](https://zod.dev/)
- [XSS Prevention](https://github.com/leizongmin/js-xss)
