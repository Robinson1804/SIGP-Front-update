# SIGP - API Reference

Referencia completa de todos los endpoints de la API del Sistema Integral de Gestión de Proyectos (SIGP).

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Módulo Auth](#módulo-auth)
4. [Módulo Proyectos (POI)](#módulo-proyectos-poi)
5. [Módulo Ágil](#módulo-ágil)
6. [Módulo RRHH](#módulo-rrhh)
7. [Módulo Planificación](#módulo-planificación)
8. [Módulo Storage](#módulo-storage)
9. [Módulo Notificaciones](#módulo-notificaciones)
10. [Módulo Dashboard](#módulo-dashboard)
11. [Enums y Constantes](#enums-y-constantes)
12. [Códigos de Error](#códigos-de-error)

## Información General

### URL Base

```
http://localhost:3010/api/v1
```

### Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

### Convenciones de Respuesta

Todas las respuestas JSON siguen este formato:

**Success (2xx)**:
```json
{
  "data": { /* resource data */ },
  "statusCode": 200,
  "message": "Success"
}
```

**Error (4xx/5xx)**:
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Descripción del error"
}
```

---

## Autenticación

### Flujo de Autenticación

1. Usuario se registra con email y contraseña
2. Usuario inicia sesión para obtener `accessToken` y `refreshToken`
3. Usar `accessToken` en header `Authorization: Bearer {token}` para cada petición
4. Cuando `accessToken` expire, usar `refreshToken` para obtener uno nuevo
5. Si `refreshToken` expira, usuario debe hacer login nuevamente

### JWT Token Payload

```json
{
  "sub": 1,
  "email": "usuario@inei.gob.pe",
  "nombre": "Juan",
  "apellido": "Perez",
  "rol": "DESARROLLADOR",
  "iat": 1704067200,
  "exp": 1704070800
}
```

### Roles Disponibles

```
ADMIN           - Acceso total al sistema
PMO             - Gestión de programas y proyectos
COORDINADOR     - Coordinación de proyectos
SCRUM_MASTER    - Gestión ágil de sprints
PATROCINADOR    - Patrocinio y seguimiento
DESARROLLADOR   - Desarrollo de tareas
IMPLEMENTADOR   - Implementación de actividades
```

---

## Módulo Auth

### POST /auth/register

Registrar nuevo usuario en el sistema.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@inei.gob.pe",
    "password": "SecurePassword123",
    "nombre": "Juan",
    "apellido": "Perez",
    "rol": "DESARROLLADOR",
    "telefono": "+51999999999"
  }'
```

**Response** (201):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "nuevo@inei.gob.pe",
    "nombre": "Juan",
    "apellido": "Perez",
    "rol": "DESARROLLADOR"
  }
}
```

**Status Code**: 201 (Created)

**Errores**:
- `409`: Email ya registrado
- `400`: Datos inválidos

---

### POST /auth/login

Login con email o username y contrasena. El endpoint acepta **email O username**, pero al menos uno es requerido.

**Request Body Schema**:
```typescript
{
  email?: string;    // Email del usuario (requerido si no se proporciona username)
  username?: string; // Username del usuario (requerido si no se proporciona email)
  password: string;  // Contrasena del usuario (requerido)
}
```

**Ejemplo con Email**:
```bash
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@inei.gob.pe",
    "password": "password123"
  }'
```

**Ejemplo con Username**:
```bash
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jperez",
    "password": "Password123!"
  }'
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "usuario@inei.gob.pe",
    "username": "jperez",
    "nombre": "Juan",
    "apellido": "Perez",
    "rol": "DESARROLLADOR"
  }
}
```

**Errores**:
- `400`: Debe proporcionar email o username
- `401`: Credenciales invalidas

---

### POST /auth/refresh

Refrescar access token usando refresh token.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": { ... }
}
```

**Errores**:
- `401`: Refresh token inválido o expirado

---

### GET /auth/profile

Obtener perfil del usuario actual (requiere autenticación).

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/auth/profile \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "email": "usuario@inei.gob.pe",
  "nombre": "Juan",
  "apellido": "Perez",
  "rol": "DESARROLLADOR",
  "avatarUrl": "https://..."
}
```

---

### PUT /auth/change-password

Cambiar contraseña del usuario actual.

**Request**:
```bash
curl -X PUT http://localhost:3010/api/v1/auth/change-password \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }'
```

**Response** (200):
```json
{
  "message": "Password changed successfully"
}
```

**Errores**:
- `400`: Contraseña actual incorrecta

---

### POST /auth/logout

Cerrar sesión del usuario.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/auth/logout \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{accessToken}"
  }'
```

**Response** (200):
```json
{
  "message": "Sesion cerrada correctamente"
}
```

---

## Módulo Proyectos (POI)

### GET /proyectos

Listar todos los proyectos (con filtros).

**Query Parameters**:
- `estado` (optional): Pendiente | En planificacion | En desarrollo | Finalizado | Cancelado
- `coordinadorId` (optional): ID del coordinador
- `scrumMasterId` (optional): ID del scrum master
- `accionEstrategicaId` (optional): ID de la acción estratégica
- `activo` (optional): true | false

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/proyectos?estado=En%20desarrollo&activo=true" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "codigo": "PRY001",
    "nombre": "Sistema de Gestión Integral",
    "descripcion": "Sistema web para gestionar proyectos...",
    "estado": "En desarrollo",
    "clasificacion": "Gestion interna",
    "accionEstrategicaId": 5,
    "coordinadorId": 2,
    "scrumMasterId": 3,
    "patrocinadorId": 4,
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  }
]
```

---

### POST /proyectos

Crear nuevo proyecto. **Roles requeridos**: ADMIN, PMO

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/proyectos \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "PRY002",
    "nombre": "Portal de Consultas Ciudadanas",
    "descripcion": "Portal interactivo para consultas ciudadanas",
    "clasificacion": "Al ciudadano",
    "accionEstrategicaId": 5,
    "coordinadorId": 2,
    "scrumMasterId": 3,
    "patrocinadorId": 4,
    "coordinacion": "Dirección de Tecnología",
    "areasFinancieras": ["1000", "2000"],
    "montoAnual": 500000,
    "anios": [2024, 2025],
    "fechaInicio": "2024-02-01T00:00:00Z",
    "fechaFin": "2024-12-31T00:00:00Z"
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "codigo": "PRY002",
  "nombre": "Portal de Consultas Ciudadanas",
  "descripcion": "Portal interactivo para consultas ciudadanas",
  "estado": "Pendiente",
  "clasificacion": "Al ciudadano",
  "accionEstrategicaId": 5,
  "createdAt": "2024-01-15T15:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

---

### GET /proyectos/{id}

Obtener detalles de un proyecto específico.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/proyectos/1 \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "codigo": "PRY001",
  "nombre": "Sistema de Gestión Integral",
  "descripcion": "Sistema web para gestionar proyectos...",
  "estado": "En desarrollo",
  "clasificacion": "Gestion interna",
  "accionEstrategicaId": 5,
  "coordinadorId": 2,
  "scrumMasterId": 3,
  "patrocinadorId": 4,
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-15T14:20:00Z"
}
```

---

### PATCH /proyectos/{id}

Actualizar un proyecto. **Roles requeridos**: ADMIN, PMO, COORDINADOR

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/proyectos/1 \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sistema de Gestión Integral - v2",
    "descripcion": "Actualización de descripción",
    "coordinadorId": 3
  }'
```

**Response** (200):
```json
{
  "id": 1,
  "codigo": "PRY001",
  "nombre": "Sistema de Gestión Integral - v2",
  "descripcion": "Actualización de descripción",
  "estado": "En desarrollo",
  "coordinadorId": 3,
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-15T16:30:00Z"
}
```

---

### DELETE /proyectos/{id}

Eliminar un proyecto. **Roles requeridos**: ADMIN, PMO

**Request**:
```bash
curl -X DELETE http://localhost:3010/api/v1/proyectos/1 \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "message": "Proyecto eliminado exitosamente"
}
```

---

## Módulo Ágil

### GET /sprints

Listar todos los sprints (con filtros).

**Query Parameters**:
- `proyectoId` (optional): ID del proyecto
- `estado` (optional): Planificado | Activo | Completado
- `activo` (optional): true | false

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/sprints?proyectoId=1&estado=Activo" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "proyectoId": 1,
    "nombre": "Sprint 1",
    "estado": "Activo",
    "sprintGoal": "Completar módulo de autenticación",
    "fechaInicio": "2024-01-15T00:00:00Z",
    "fechaFin": "2024-01-29T00:00:00Z",
    "capacidadEquipo": 40,
    "createdAt": "2024-01-10T10:30:00Z"
  }
]
```

---

### POST /sprints

Crear nuevo sprint. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/sprints \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "proyectoId": 1,
    "nombre": "Sprint 2",
    "sprintGoal": "Completar módulo de proyectos",
    "fechaInicio": "2024-02-01T00:00:00Z",
    "fechaFin": "2024-02-15T00:00:00Z",
    "capacidadEquipo": 45
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "proyectoId": 1,
  "nombre": "Sprint 2",
  "estado": "Planificado",
  "sprintGoal": "Completar módulo de proyectos",
  "fechaInicio": "2024-02-01T00:00:00Z",
  "fechaFin": "2024-02-15T00:00:00Z",
  "capacidadEquipo": 45,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### GET /sprints/{id}

Obtener detalles de un sprint.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/sprints/1 \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "proyectoId": 1,
  "nombre": "Sprint 1",
  "estado": "Activo",
  "sprintGoal": "Completar módulo de autenticación",
  "fechaInicio": "2024-01-15T00:00:00Z",
  "fechaFin": "2024-01-29T00:00:00Z",
  "capacidadEquipo": 40,
  "createdAt": "2024-01-10T10:30:00Z"
}
```

---

### PATCH /sprints/{id}/iniciar

Iniciar un sprint. **Roles requeridos**: ADMIN, PMO, SCRUM_MASTER

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/sprints/1/iniciar \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "estado": "Activo",
  "nombre": "Sprint 1",
  "message": "Sprint iniciado exitosamente"
}
```

---

### PATCH /sprints/{id}/cerrar

Cerrar un sprint. **Roles requeridos**: ADMIN, PMO, SCRUM_MASTER

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/sprints/1/cerrar \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "razonCierre": "Sprint completado exitosamente"
  }'
```

**Response** (200):
```json
{
  "id": 1,
  "estado": "Completado",
  "nombre": "Sprint 1",
  "message": "Sprint cerrado exitosamente"
}
```

---

### GET /sprints/{id}/burndown

Obtener gráfico burndown del sprint.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/sprints/1/burndown \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "sprintId": 1,
  "dias": [
    "2024-01-15",
    "2024-01-16",
    "2024-01-17",
    "2024-01-18",
    "2024-01-19"
  ],
  "storyPointsRestantes": [40, 38, 35, 30, 25],
  "storyPointsIdeal": [40, 35, 30, 25, 20]
}
```

---

### GET /sprints/{id}/metricas

Obtener métricas del sprint.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/sprints/1/metricas \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "sprintId": 1,
  "velocidad": 8.5,
  "storyPointsPlaneados": 40,
  "storyPointsCompletados": 34,
  "tasaCompletitud": 85,
  "historiasTerminadas": 6,
  "historiasEnProgreso": 2,
  "historiasNoIniciadas": 1,
  "burnVelocity": 2.8
}
```

---

### GET /historias-usuario

Listar historias de usuario (con filtros).

**Query Parameters**:
- `proyectoId` (optional): ID del proyecto
- `epicaId` (optional): ID de la épica
- `sprintId` (optional): ID del sprint
- `estado` (optional): Pendiente | En analisis | Lista | En desarrollo | En pruebas | En revision | Terminada
- `prioridad` (optional): Must | Should | Could | Wont
- `asignadoA` (optional): ID del usuario asignado
- `enBacklog` (optional): true | false

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/historias-usuario?proyectoId=1&estado=En%20desarrollo" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "proyectoId": 1,
    "epicaId": 1,
    "sprintId": 1,
    "codigo": "HU001",
    "titulo": "Como usuario quiero autenticarme en el sistema",
    "rol": "usuario",
    "quiero": "autenticarme en el sistema",
    "para": "acceder a mis datos",
    "prioridad": "Must",
    "estimacion": "M",
    "storyPoints": 8,
    "estado": "En desarrollo",
    "asignadoA": 2,
    "criteriosAceptacion": [
      {
        "given": "El usuario está en la página de login",
        "when": "Ingresa credenciales válidas",
        "then": "Se loguea exitosamente"
      }
    ],
    "createdAt": "2024-01-10T10:30:00Z"
  }
]
```

---

### POST /historias-usuario

Crear nueva historia de usuario. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/historias-usuario \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "proyectoId": 1,
    "epicaId": 1,
    "sprintId": 1,
    "codigo": "HU002",
    "titulo": "Como usuario quiero recuperar mi contraseña",
    "rol": "usuario",
    "quiero": "recuperar mi contraseña",
    "para": "acceder si la olvido",
    "prioridad": "Should",
    "estimacion": "S",
    "storyPoints": 5,
    "asignadoA": 3,
    "criteriosAceptacion": [
      {
        "given": "El usuario está en la página de login",
        "when": "Hace clic en recuperar contraseña",
        "then": "Recibe email con link de reset"
      }
    ]
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "proyectoId": 1,
  "epicaId": 1,
  "sprintId": 1,
  "codigo": "HU002",
  "titulo": "Como usuario quiero recuperar mi contraseña",
  "rol": "usuario",
  "quiero": "recuperar mi contraseña",
  "para": "acceder si la olvido",
  "prioridad": "Should",
  "estimacion": "S",
  "storyPoints": 5,
  "estado": "Pendiente",
  "asignadoA": 3,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### GET /historias-usuario/{id}

Obtener detalles de una historia de usuario.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/historias-usuario/1 \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "proyectoId": 1,
  "epicaId": 1,
  "sprintId": 1,
  "codigo": "HU001",
  "titulo": "Como usuario quiero autenticarme en el sistema",
  "rol": "usuario",
  "quiero": "autenticarme en el sistema",
  "para": "acceder a mis datos",
  "prioridad": "Must",
  "estimacion": "M",
  "storyPoints": 8,
  "estado": "En desarrollo",
  "asignadoA": 2,
  "criteriosAceptacion": [
    {
      "given": "El usuario está en la página de login",
      "when": "Ingresa credenciales válidas",
      "then": "Se loguea exitosamente"
    }
  ],
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-15T14:20:00Z"
}
```

---

### PATCH /historias-usuario/{id}/estado

Cambiar estado de una historia de usuario. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER, DESARROLLADOR

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/historias-usuario/1/estado \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "Terminada"
  }'
```

**Response** (200):
```json
{
  "id": 1,
  "codigo": "HU001",
  "titulo": "Como usuario quiero autenticarme en el sistema",
  "estado": "Terminada",
  "updatedAt": "2024-01-20T16:30:00Z"
}
```

---

### GET /tareas

Listar tareas (con filtros).

**Query Parameters**:
- `tipo` (optional): SCRUM | KANBAN
- `historiaUsuarioId` (optional): ID de la historia de usuario
- `actividadId` (optional): ID de la actividad
- `estado` (optional): Por hacer | En progreso | En revision | Finalizado
- `prioridad` (optional): Alta | Media | Baja
- `asignadoA` (optional): ID del usuario asignado

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/tareas?estado=En%20progreso" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "titulo": "Crear endpoint de login",
    "descripcion": "Implementar endpoint POST /auth/login",
    "tipo": "SCRUM",
    "estado": "En progreso",
    "prioridad": "Alta",
    "historiaUsuarioId": 1,
    "asignadoA": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### POST /tareas

Crear nueva tarea. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/tareas \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Validar credenciales en login",
    "descripcion": "Implementar validación de email y contraseña",
    "tipo": "SCRUM",
    "historiaUsuarioId": 1,
    "prioridad": "Alta",
    "asignadoA": 2,
    "estimacionHoras": 4
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "titulo": "Validar credenciales en login",
  "descripcion": "Implementar validación de email y contraseña",
  "tipo": "SCRUM",
  "estado": "Por hacer",
  "prioridad": "Alta",
  "historiaUsuarioId": 1,
  "asignadoA": 2,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### PATCH /tareas/{id}/estado

Cambiar estado de una tarea. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER, DESARROLLADOR

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/tareas/1/estado \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "Finalizado"
  }'
```

**Response** (200):
```json
{
  "id": 1,
  "titulo": "Crear endpoint de login",
  "estado": "Finalizado",
  "updatedAt": "2024-01-20T16:30:00Z"
}
```

---

## Módulo RRHH

### GET /personal

Listar personal (con filtros).

**Query Parameters**:
- `divisionId` (optional): ID de la división
- `modalidad` (optional): Planilla | CAS | Locador | Practicante
- `disponible` (optional): true | false
- `activo` (optional): true | false
- `busqueda` (optional): Búsqueda por nombre, email, etc.

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/personal?disponible=true&activo=true" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Perez",
    "email": "juan.perez@inei.gob.pe",
    "telefono": "+51999999999",
    "divisionId": 1,
    "modalidad": "Planilla",
    "disponible": true,
    "horasDisponibles": 40,
    "createdAt": "2024-01-10T10:30:00Z"
  }
]
```

---

### POST /personal

Crear nuevo personal. **Roles requeridos**: ADMIN, PMO

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/personal \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Maria",
    "apellido": "Garcia",
    "email": "maria.garcia@inei.gob.pe",
    "telefono": "+51988888888",
    "divisionId": 2,
    "modalidad": "CAS"
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "nombre": "Maria",
  "apellido": "Garcia",
  "email": "maria.garcia@inei.gob.pe",
  "telefono": "+51988888888",
  "divisionId": 2,
  "modalidad": "CAS",
  "disponible": true,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### GET /personal/{id}/habilidades

Obtener habilidades de un personal.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/personal/1/habilidades \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "nombre": "Java",
    "categoria": "Backend",
    "nivel": "Avanzado",
    "aniosDev": 5,
    "porcentajeUso": 80
  },
  {
    "id": 2,
    "nombre": "Spring Boot",
    "categoria": "Backend",
    "nivel": "Avanzado",
    "aniosDev": 4,
    "porcentajeUso": 85
  }
]
```

---

### POST /personal/{id}/habilidades

Asignar habilidad a un personal. **Roles requeridos**: ADMIN, PMO

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/personal/1/habilidades \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "habilidadId": 3,
    "nivel": "Intermedio",
    "aniosDev": 2,
    "porcentajeUso": 50
  }'
```

**Response** (201):
```json
{
  "personalId": 1,
  "habilidadId": 3,
  "habilidadNombre": "Python",
  "nivel": "Intermedio",
  "aniosDev": 2,
  "porcentajeUso": 50,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

## Módulo Planificación

### GET /pgd

Listar planes de gobierno (PGD).

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/pgd \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
[
  {
    "id": 1,
    "nombre": "Plan de Gobierno 2023-2025",
    "anio": 2023,
    "vigente": true,
    "descripcion": "Plan estratégico para los años 2023-2025",
    "createdAt": "2023-12-20T10:30:00Z"
  }
]
```

---

### POST /pgd

Crear nuevo PGD. **Roles requeridos**: ADMIN, PMO

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/pgd \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Plan de Gobierno 2024-2026",
    "anio": 2024,
    "descripcion": "Plan estratégico para los años 2024-2026"
  }'
```

**Response** (201):
```json
{
  "id": 2,
  "nombre": "Plan de Gobierno 2024-2026",
  "anio": 2024,
  "vigente": false,
  "descripcion": "Plan estratégico para los años 2024-2026",
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### GET /pgd/vigente

Obtener el PGD vigente.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/pgd/vigente \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "nombre": "Plan de Gobierno 2023-2025",
  "anio": 2023,
  "vigente": true,
  "descripcion": "Plan estratégico para los años 2023-2025"
}
```

---

## Módulo Storage

### POST /upload/request-url

Solicitar URL presignada para subida de archivo.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/upload/request-url \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "entidadTipo": "PROYECTO",
    "entidadId": 1,
    "categoria": "documento",
    "nombreArchivo": "arquitectura_sistema.pdf",
    "mimeType": "application/pdf",
    "tamano": 2048576,
    "metadata": {
      "fase": "Diseño",
      "version": "1.0"
    }
  }'
```

**Response** (201):
```json
{
  "uploadUrl": "https://minio.inei.gob.pe/sigp/proyecto_1/arquitectura.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
  "archivoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "objectKey": "proyecto_1/arquitectura.pdf",
  "bucket": "sigp",
  "expiresIn": 3600,
  "requiredHeaders": {
    "Content-Type": "application/pdf"
  }
}
```

**Flujo de Subida**:

1. Obtener URL presignada (arriba)
2. Subir archivo a MinIO usando la URL:
```bash
curl -X PUT \
  -H "Content-Type: application/pdf" \
  --data-binary @arquitectura_sistema.pdf \
  "https://minio.inei.gob.pe/sigp/proyecto_1/arquitectura.pdf?X-Amz-Algorithm=..."
```
3. Confirmar subida (ver abajo)

---

### POST /upload/confirm

Confirmar que la subida fue completada.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/upload/confirm \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "archivoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "checksumMd5": "5d41402abc4b2a76b9719d911017c592"
  }'
```

**Response** (200):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "nombreOriginal": "arquitectura_sistema.pdf",
  "nombreAlmacenado": "arquitectura_sistema_abc123.pdf",
  "mimeType": "application/pdf",
  "tamanoBytes": 2048576,
  "tamanoLegible": "2.0 MB",
  "categoria": "documento",
  "estado": "disponible",
  "entidadTipo": "PROYECTO",
  "entidadId": 1,
  "version": 1,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### POST /upload/direct

Subida directa de archivo (para archivos pequeños).

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/upload/direct \
  -H "Authorization: Bearer {accessToken}" \
  -F "file=@documento.pdf" \
  -F "entidadTipo=PROYECTO" \
  -F "entidadId=1" \
  -F "categoria=documento" \
  -F 'metadata={"fase":"Diseño"}'
```

**Response** (201):
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "nombreOriginal": "documento.pdf",
  "nombreAlmacenado": "documento_xyz789.pdf",
  "mimeType": "application/pdf",
  "tamanoBytes": 1024000,
  "tamanoLegible": "1.0 MB",
  "categoria": "documento",
  "estado": "disponible",
  "entidadTipo": "PROYECTO",
  "entidadId": 1,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### POST /upload/{id}/version

Crear nueva versión de un archivo.

**Request**:
```bash
curl -X POST http://localhost:3010/api/v1/upload/a1b2c3d4-e5f6-7890-abcd-ef1234567890/version \
  -H "Authorization: Bearer {accessToken}" \
  -F "file=@arquitectura_sistema_v2.pdf" \
  -F "comentario=Actualización con feedback del cliente"
```

**Response** (201):
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "nombreOriginal": "arquitectura_sistema_v2.pdf",
  "nombreAlmacenado": "arquitectura_sistema_v2_def456.pdf",
  "mimeType": "application/pdf",
  "tamanoBytes": 2097152,
  "tamanoLegible": "2.0 MB",
  "categoria": "documento",
  "estado": "disponible",
  "entidadTipo": "PROYECTO",
  "entidadId": 1,
  "version": 2,
  "archivoPadreId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "createdAt": "2024-01-21T10:30:00Z"
}
```

---

## Módulo Notificaciones

### GET /notificaciones

Obtener notificaciones del usuario actual.

**Query Parameters**:
- `leida` (optional): true | false
- `tipo` (optional): Proyectos | Sprints | Retrasos | Aprobaciones | Tareas | Documentos | Sistema
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Registros por página (default: 20)

**Request**:
```bash
curl -X GET "http://localhost:3010/api/v1/notificaciones?leida=false&page=1&limit=10" \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "usuarioId": 1,
      "titulo": "Nueva Historia de Usuario Asignada",
      "mensaje": "Se ha asignado la historia HU001 a tu usuario",
      "tipo": "Tareas",
      "entidadTipo": "HISTORIA_USUARIO",
      "entidadId": 1,
      "leida": false,
      "createdAt": "2024-01-20T15:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

---

### PATCH /notificaciones/{id}/leer

Marcar notificación como leída.

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/notificaciones/1/leer \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "id": 1,
  "leida": true,
  "updatedAt": "2024-01-20T16:30:00Z"
}
```

---

### PATCH /notificaciones/leer-todas

Marcar todas las notificaciones como leídas.

**Request**:
```bash
curl -X PATCH http://localhost:3010/api/v1/notificaciones/leer-todas \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "message": "Todas las notificaciones han sido marcadas como leídas",
  "notificacionesMarcadas": 5
}
```

---

## Módulo Dashboard

### GET /dashboard

Obtener dashboard general. **Roles requeridos**: ADMIN, PMO, COORDINADOR

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/dashboard \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "totalProyectos": 15,
  "proyectosActivos": 8,
  "proyectosFinalizados": 5,
  "totalSprints": 32,
  "sprintsActivos": 6,
  "totalHistoriasUsuario": 180,
  "historiasTerminadas": 120,
  "progresoPorcentaje": 66.7,
  "proximasActividades": [
    {
      "id": 1,
      "titulo": "Actividad pendiente 1",
      "proyecto": "Sistema de Gestión",
      "fechaVencimiento": "2024-01-25T00:00:00Z",
      "asignadoA": "Juan Perez"
    }
  ],
  "proximosSprints": [
    {
      "id": 2,
      "nombre": "Sprint 2",
      "proyecto": "Sistema de Gestión",
      "fechaInicio": "2024-02-01T00:00:00Z"
    }
  ]
}
```

---

### GET /dashboard/proyecto/{id}

Dashboard de un proyecto específico. **Roles requeridos**: ADMIN, PMO, COORDINADOR, SCRUM_MASTER, DESARROLLADOR

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/dashboard/proyecto/1 \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "proyectoId": 1,
  "nombre": "Sistema de Gestión Integral",
  "estado": "En desarrollo",
  "totalSprints": 4,
  "sprintsCompletados": 1,
  "storyPointsPlaneados": 160,
  "storyPointsCompletados": 42,
  "historiasUsuario": {
    "total": 20,
    "pendientes": 5,
    "enProgreso": 8,
    "terminadas": 7
  },
  "tasas": {
    "completitud": 26.25,
    "velocidad": 10.5
  }
}
```

---

### GET /dashboard/proyecto/{id}/burndown

Burndown chart del proyecto.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/dashboard/proyecto/1/burndown \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "proyectoId": 1,
  "sprints": [
    {
      "sprintId": 1,
      "nombre": "Sprint 1",
      "dias": ["2024-01-15", "2024-01-16", "2024-01-17"],
      "storyPointsRestantes": [40, 38, 35],
      "storyPointsIdeal": [40, 35, 30]
    }
  ]
}
```

---

### GET /dashboard/proyecto/{id}/velocidad

Velocidad del equipo.

**Request**:
```bash
curl -X GET http://localhost:3010/api/v1/dashboard/proyecto/1/velocidad \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "proyectoId": 1,
  "velocidades": [
    {
      "sprintId": 1,
      "nombre": "Sprint 1",
      "velocidad": 8.5
    },
    {
      "sprintId": 2,
      "nombre": "Sprint 2",
      "velocidad": 9.2
    }
  ],
  "velocidadPromedio": 8.85,
  "tendencia": "creciente"
}
```

---

## Enums y Constantes

### Roles de Usuario

```typescript
ADMIN           // Acceso total
PMO             // Gestión de programas y proyectos
COORDINADOR     // Coordinación de proyectos
SCRUM_MASTER    // Gestión ágil
PATROCINADOR    // Patrocinio
DESARROLLADOR   // Desarrollo
IMPLEMENTADOR   // Implementación
```

### Estados de Proyecto

```typescript
Pendiente           // Proyecto pendiente de iniciar
En planificacion    // En fase de planificación
En desarrollo       // En ejecución
Finalizado          // Completado
Cancelado           // Cancelado
```

### Estados de Sprint

```typescript
Planificado     // Planificado pero no iniciado
Activo          // Sprint activo
Completado      // Sprint completado
```

### Estados de Historia de Usuario

```typescript
Pendiente       // No iniciada
En analisis     // En análisis
Lista           // Lista para desarrollo
En desarrollo   // En desarrollo
En pruebas      // En pruebas
En revision     // En revisión
Terminada       // Completada
```

### Estados de Tarea

```typescript
Por hacer       // No iniciada
En progreso     // En progreso
En revision     // En revisión
Finalizado      // Completada
```

### Prioridades

```typescript
Must            // Imprescindible
Should          // Importante
Could           // Deseable
Wont            // No será incluida

// Para tareas:
Alta            // Alta prioridad
Media           // Media prioridad
Baja            // Baja prioridad
```

### Estimaciones

```typescript
XS              // Extra pequeño (1 punto)
S               // Pequeño (2-3 puntos)
M               // Medio (5 puntos)
L               // Grande (8 puntos)
XL              // Extra grande (13 puntos)
XXL             // Muy grande (21+ puntos)
```

### Categorías de Archivo

```typescript
documento       // Documento general
evidencia       // Evidencia de trabajo
acta            // Acta de reunión
informe         // Informe
cronograma      // Cronograma
avatar          // Foto de perfil
adjunto         // Adjunto general
backup          // Backup
```

### Tipos de Notificación

```typescript
Proyectos       // Notificaciones sobre proyectos
Sprints         // Notificaciones sobre sprints
Retrasos        // Alertas de retrasos
Aprobaciones    // Solicitudes de aprobación
Tareas          // Notificaciones sobre tareas
Documentos      // Notificaciones sobre documentos
Sistema         // Notificaciones del sistema
```

### Modalidades de Personal

```typescript
Planilla        // Personal de planilla
CAS             // Contrato administrativo de servicios
Locador         // Locador
Practicante     // Practicante
```

---

## Códigos de Error

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Datos inválidos o malformados"
}
```

Causas comunes:
- Datos requeridos faltantes
- Tipos de dato incorrectos
- Validaciones fallidas

---

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "No autenticado o token expirado"
}
```

Causas comunes:
- Token no proporcionado
- Token expirado
- Credenciales inválidas

---

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Roles insuficientes para esta acción"
}
```

Causas comunes:
- Rol de usuario no tiene permisos
- Acción restringida a ciertos roles

---

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Recurso no encontrado"
}
```

Causas comunes:
- ID no existe
- Recurso ha sido eliminado

---

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Conflict",
  "error": "Email ya registrado"
}
```

Causas comunes:
- Recurso duplicado
- Email ya existe

---

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error interno del servidor"
}
```

Causas comunes:
- Error en la base de datos
- Excepción no capturada
- Servicio indisponible

---

## Rate Limiting

Por defecto, la API no tiene rate limiting implementado. Se recomienda implementar en producción:

- 1000 requests por minuto por IP
- 100 requests por minuto por usuario autenticado

---

## Versionado de API

La API actual es v1:
- URL: `/api/v1`
- Versión: 1.0.0
- Fecha: 2024-01-20

Cambios futuros se documentarán en la sección de Breaking Changes.

---

## Suporte y Contacto

Para reportar bugs o solicitar features:
- Email: api@inei.gob.pe
- Issues: https://github.com/inei/sigp-backend/issues
