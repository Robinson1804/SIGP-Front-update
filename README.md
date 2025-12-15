# SIGP Frontend - Sistema Integrado de Gestión de Proyectos

Frontend del sistema SIGP construido con Next.js 14 (App Router), TypeScript, Tailwind CSS y shadcn/ui.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Estado:** React Query + Context API
- **Formularios:** React Hook Form + Zod
- **HTTP Client:** Axios
- **WebSockets:** Socket.IO Client
- **Puerto:** 3011

## 📋 Prerequisitos

- Node.js 18+
- Backend corriendo en puerto 3010
- npm o yarn

## 🔧 Instalación

### 1. Instalar dependencias
```bash
cd sigp-frontend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

Variables principales:
```env
NEXT_PUBLIC_API_URL=http://localhost:3010
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_WS_URL=ws://localhost:3010
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3011**

## ⚠️ IMPORTANTE: Este es un Proyecto de REFACTORIZACIÓN

Este frontend **NO se construye desde cero**. Ya existe código que necesita:

1. **Análisis completo** (Prompt 00 - OBLIGATORIO)
2. **Refactorización incremental** (Prompts 01-15)
3. **NO reescribir** - Adaptar código existente

### Primer Paso Obligatorio:
```bash
# Ejecutar Prompt 00 - Análisis y Diagnóstico
# Genera 8 documentos en docs/analisis/
```

## 📊 Arquitectura BD (para Tipos TypeScript)

Usa estos archivos para crear tipos correctos:

- **03a_ARQUITECTURA_CORE.md** - Usuario, Area, Planning, RRHH
- **03b_ARQUITECTURA_POI.md** - Proyecto, Reunion, Requerimiento, HU
- **03c_ARQUITECTURA_AGIL.md** - Sprint, Tarea, Tablero Kanban

**Ver:** `docs/arquitectura/03_INDICE_ARQUITECTURA_BD.md`

### Crear tipos TypeScript desde BD:
```typescript
// 1. Leer tabla en docs/arquitectura/03X
// 2. Copiar TODOS los campos
// 3. Crear interface en src/types/entities.types.ts

// Ejemplo: Usuario (de 03a)
export interface Usuario {
  id: number;
  uuid: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  rol: UsuarioRol;
  // ... todos los campos
}
```

## 📂 Estructura del Proyecto
```
src/
├── app/                  # Rutas (App Router)
│   ├── (auth)/          # Grupo: login, registro
│   ├── (dashboard)/     # Grupo: dashboard protegido
│   │   ├── proyectos/
│   │   ├── sprints/
│   │   ├── tablero/
│   │   └── ...
│   └── layout.tsx
│
├── components/          # Componentes React
│   ├── ui/             # shadcn/ui
│   ├── layout/         # Header, Sidebar
│   ├── forms/          # Formularios reutilizables
│   └── proyectos/      # Componentes de proyectos
│
├── lib/                 # Utilidades
│   ├── api-client.ts   # Axios configurado
│   ├── socket.ts       # Socket.IO
│   └── utils.ts
│
├── services/            # Servicios API
│   ├── auth.service.ts
│   ├── proyectos.service.ts
│   └── index.ts
│
├── types/               # Tipos TypeScript
│   ├── entities.types.ts  # Usuario, Proyecto, Sprint
│   ├── api.types.ts       # ApiResponse, Paginated
│   └── auth.types.ts
│
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useProyectos.ts
│   └── useWebSocket.ts
│
├── providers/           # Context Providers
│   ├── AuthProvider.tsx
│   └── QueryProvider.tsx
│
└── styles/
    └── globals.css
```

## 🎯 Orden de Refactorización

**Ver:** `docs/prompts/frontend/00_INDICE.md`

**Flujo obligatorio:**
```
00_analisis_diagnostico (PRIMERO - 2h)
  ↓
01_configuracion_base (Variables, apiClient, tipos)
  ↓
02_refactorizar_auth (Login, middleware, guards)
  ↓
03_servicios_api (Todos los services)
  ↓
04_componentes_principales
  ↓
05_react_query_websockets
  ↓
06-15: Módulos específicos
```

## 🔒 Autenticación

### Login:
```typescript
import authService from '@/services/auth.service';

const { data } = await authService.login({
  email: 'usuario@inei.gob.pe',
  password: 'password123'
});

// data contiene: { accessToken, refreshToken, user }
```

### Protected Routes:
```typescript
// src/middleware.ts protege rutas automáticamente
// Redirige a /login si no hay token
// Redirige a /dashboard si ya está autenticado
```

### API Client (automático):
```typescript
// apiClient agrega token automáticamente
import apiClient from '@/lib/api-client';

// Token se agrega en header Authorization
const response = await apiClient.get('/proyectos');
```

## 📖 Documentación del Backend

Swagger del backend: **http://localhost:3010/api/docs**

## ✅ Comandos Útiles
```bash
# Desarrollo
npm run dev              # Dev server (puerto 3011)
npm run build            # Build producción
npm run start            # Iniciar producción
npm run lint             # ESLint
npm run lint:fix         # Fix automático

# Testing
npm run test             # Tests unitarios
npm run test:watch       # Watch mode
npm run test:e2e         # Tests e2e (Playwright)

# Tipos
npm run type-check       # Verificar TypeScript
```

## 🔗 Integración con Backend

### URLs:
- **API:** http://localhost:3010/api/v1
- **Swagger:** http://localhost:3010/api/docs
- **WebSocket:** ws://localhost:3010

### Response Format:
```typescript
interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  message?: string;
}
```

### Ejemplo de Servicio:
```typescript
// src/services/proyectos.service.ts
import apiClient from '@/lib/api-client';

class ProyectosService {
  async getAll() {
    const response = await apiClient.get<Proyecto[]>('/proyectos');
    return response.data; // apiClient extrae .data automáticamente
  }
}

export default new ProyectosService();
```

## 🎨 Diseño y UI

### Componentes shadcn/ui disponibles:
- Button, Input, Select, Textarea
- Card, Alert, Badge, Avatar
- Dialog, Sheet, Popover
- Table, Tabs, Accordion
- Toast (notificaciones)
- Y más...

### Tailwind CSS:
```tsx
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-md">
  <Button variant="default" size="lg">
    Crear Proyecto
  </Button>
</div>
```

### Temas:
- Light mode por defecto
- Dark mode configurado (usar `dark:` prefix)

## 📝 Progreso del Desarrollo

Ver: `docs/logs/frontend-progress.md`

Actualizar después de cada prompt con:
- Prompt completado
- Código refactorizado
- Tiempo invertido
- Notas importantes

## 🔍 Debugging

### React DevTools:
- Inspeccionar componentes
- Ver state y props
- Performance profiling

### Network:
- Ver llamadas API en DevTools → Network
- Verificar responses del backend
- Validar tokens JWT

### Console:
```typescript
// En desarrollo, puedes usar:
if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('Debug info:', data);
}
```

## 🐛 Troubleshooting

### Backend no responde:
```bash
# Verificar que backend esté corriendo
curl http://localhost:3010/api/v1/health

# Debe retornar: {"status":"ok"}
```

### Error CORS:
```bash
# Backend debe tener configurado:
# origin: 'http://localhost:3011'
# Ver backend/.env → FRONTEND_URL
```

### Token expirado:
```typescript
// apiClient renueva automáticamente en 401
// Si falla, redirige a /login
```

### Build fails:
```bash
# Limpiar cache
rm -rf .next
npm run build
```

## 📦 Build y Deploy

### Build de producción:
```bash
npm run build
npm run start
```

### Variables de entorno en producción:
```env
NEXT_PUBLIC_API_URL=https://api-sigp.inei.gob.pe
NEXT_PUBLIC_WS_URL=wss://api-sigp.inei.gob.pe
```

## 📞 Soporte

Para dudas:
1. Lee `docs/00_CONTEXT.md` (contexto general)
2. Consulta análisis en `docs/analisis/` (después de Prompt 00)
3. Revisa arquitectura BD para tipos: `docs/arquitectura/`
4. Consulta Swagger backend: http://localhost:3010/api/docs

## 🤝 Contribución

Este es un proyecto de refactorización:
- **NO reescribir** código desde cero
- **SÍ adaptar** código existente
- **SÍ seguir** el orden de prompts
- **SÍ documentar** cambios en logs

## 📄 Licencia

Propiedad del INEI - Uso interno

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024