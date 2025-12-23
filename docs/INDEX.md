# Documentación SIGP Frontend

**Sistema Integrado de Gestión de Proyectos - Frontend**

Este índice proporciona acceso a toda la documentación del proyecto SIGP Frontend.

---

## Estructura de Documentación

```
docs/
├── api/                    # Documentación de API y endpoints
├── features/               # Documentación de módulos/features
├── guides/                 # Guías de desarrollo y migración
├── implementation/         # Documentos de implementación de features
├── setup/                  # Configuración del proyecto y herramientas
├── specs/                  # Especificaciones técnicas del sistema
├── INDEX.md                # Este archivo
└── MATRIZ_IMPLEMENTACION.md
```

---

## Guía de Inicio Rápido

| Si necesitas... | Ve a... |
|----------------|---------|
| Entender el proyecto | [specs/01_RESUMEN_EJECUTIVO.md](specs/01_RESUMEN_EJECUTIVO.md) |
| Conectar con el API | [api/QUICKSTART.md](api/QUICKSTART.md) |
| Configurar Claude Code | [setup/CLAUDE_CODE_SETUP.md](setup/CLAUDE_CODE_SETUP.md) |
| Ver estado de implementación | [MATRIZ_IMPLEMENTACION.md](MATRIZ_IMPLEMENTACION.md) |
| Implementar una feature | [guides/MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md) |

---

## 1. Especificaciones Técnicas (`specs/`)

Documentación técnica fundacional del sistema.

| Documento | Descripción |
|-----------|-------------|
| [01_RESUMEN_EJECUTIVO.md](specs/01_RESUMEN_EJECUTIVO.md) | Visión general del proyecto SIGP |
| [02_REQUERIMIENTOS.md](specs/02_REQUERIMIENTOS.md) | Requerimientos funcionales y no funcionales |
| [03_ARQUITECTURA_SISTEMA.md](specs/03_ARQUITECTURA_SISTEMA.md) | Arquitectura general del sistema |
| [04_ARQUITECTURA_BD.md](specs/04_ARQUITECTURA_BD.md) | Esquema de base de datos completo |
| [05_ESPECIFICACION_APIs.md](specs/05_ESPECIFICACION_APIs.md) | Especificación de endpoints |
| [06_MODULOS_FUNCIONALES.md](specs/06_MODULOS_FUNCIONALES.md) | Módulos del sistema |
| [07_MATRIZ_PERMISOS.md](specs/07_MATRIZ_PERMISOS.md) | Sistema de permisos RBAC |
| [08_GLOSARIO.md](specs/08_GLOSARIO.md) | Glosario de términos |
| [ARQUITECTURA_SISTEMA_FRONTEND.md](specs/ARQUITECTURA_SISTEMA_FRONTEND.md) | Arquitectura específica del frontend |
| [MATRIZ_PERMISOS_COMPLETA.md](specs/MATRIZ_PERMISOS_COMPLETA.md) | Matriz completa de permisos por rol |

---

## 2. Documentación de API (`api/`)

Referencia completa de la API del backend.

| Documento | Descripción |
|-----------|-------------|
| [README.md](api/README.md) | Introducción a la API |
| [QUICKSTART.md](api/QUICKSTART.md) | Guía rápida de integración |
| [API_REFERENCE.md](api/API_REFERENCE.md) | Referencia completa de endpoints |
| [API_QUICK_REFERENCE.md](api/API_QUICK_REFERENCE.md) | Referencia rápida de endpoints |
| [AUTHENTICATION.md](api/AUTHENTICATION.md) | Autenticación y JWT |
| [EXAMPLES.md](api/EXAMPLES.md) | Ejemplos de uso de la API |
| [INTEGRATION_GUIDE.md](api/INTEGRATION_GUIDE.md) | Guía de integración frontend-backend |
| [INDEX.md](api/INDEX.md) | Índice de documentación de API |
| [openapi.yaml](api/openapi.yaml) | Especificación OpenAPI/Swagger |

---

## 3. Guías de Desarrollo (`guides/`)

Guías prácticas para desarrollo y mantenimiento.

| Documento | Descripción |
|-----------|-------------|
| [BACKEND_STRUCTURE_GUIDE.md](guides/BACKEND_STRUCTURE_GUIDE.md) | Estructura del backend NestJS |
| [MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md) | Guía de migración y refactoring |
| [REFACTORING_CHANGES.md](guides/REFACTORING_CHANGES.md) | Changelog de refactorización |
| [PROJECT_STATUS_REPORT.md](guides/PROJECT_STATUS_REPORT.md) | Reporte de estado del proyecto |
| [WEBSOCKET_INTEGRATION.md](guides/WEBSOCKET_INTEGRATION.md) | Integración WebSocket frontend |
| [BACKEND_WEBSOCKET_INTEGRATION.md](guides/BACKEND_WEBSOCKET_INTEGRATION.md) | Integración WebSocket backend |
| [IMPLEMENTATION_SUMMARY.md](guides/IMPLEMENTATION_SUMMARY.md) | Resumen de implementación |

---

## 4. Documentación de Features (`features/`)

Documentación de módulos específicos implementados.

| Documento | Descripción |
|-----------|-------------|
| [APROBACIONES_MODULE.md](features/APROBACIONES_MODULE.md) | Módulo de flujos de aprobación |
| [INFORMES_MODULE.md](features/INFORMES_MODULE.md) | Módulo de informes Sprint/Actividad |
| [QUICK_START_APROBACIONES.md](features/QUICK_START_APROBACIONES.md) | Guía rápida de aprobaciones |

---

## 5. Documentos de Implementación (`implementation/`)

Documentación detallada de implementaciones específicas.

| Documento | Descripción |
|-----------|-------------|
| [PLAN_IMPLEMENTACION.md](implementation/PLAN_IMPLEMENTACION.md) | Plan multi-agente de implementación |
| [APPROVAL_WORKFLOW_IMPLEMENTATION.md](implementation/APPROVAL_WORKFLOW_IMPLEMENTATION.md) | Implementación de flujos de aprobación |
| [DASHBOARD_IMPLEMENTATION.md](implementation/DASHBOARD_IMPLEMENTATION.md) | Implementación del dashboard |
| [WEBSOCKET_IMPLEMENTATION.md](implementation/WEBSOCKET_IMPLEMENTATION.md) | Implementación de WebSocket |
| [SPRINT_BOARD_INTEGRATION.md](implementation/SPRINT_BOARD_INTEGRATION.md) | Integración del tablero de sprint |
| [INTEGRATION_CHECKLIST.md](implementation/INTEGRATION_CHECKLIST.md) | Checklist de integración |
| [IMPLEMENTATION_SUMMARY.md](implementation/IMPLEMENTATION_SUMMARY.md) | Resumen de implementación |

---

## 6. Configuración (`setup/`)

Configuración del entorno de desarrollo.

| Documento | Descripción |
|-----------|-------------|
| [CLAUDE_CODE_SETUP.md](setup/CLAUDE_CODE_SETUP.md) | Configuración de Claude Code para SIGP |

---

## 7. Matriz de Implementación

| Documento | Descripción |
|-----------|-------------|
| [MATRIZ_IMPLEMENTACION.md](MATRIZ_IMPLEMENTACION.md) | Estado de implementación por módulo |

---

## Documentación en Código (`src/`)

Documentación específica dentro del código fuente.

| Ubicación | Descripción |
|-----------|-------------|
| [src/features/README.md](../src/features/README.md) | Estructura de features |
| [src/features/dashboard/README.md](../src/features/dashboard/README.md) | Módulo Dashboard |
| [src/components/dnd/README.md](../src/components/dnd/README.md) | Componentes Drag & Drop |
| [src/components/dnd/INTEGRATION_GUIDE.md](../src/components/dnd/INTEGRATION_GUIDE.md) | Guía de integración DnD |

---

## Archivos Raíz Importantes

| Archivo | Descripción |
|---------|-------------|
| [README.md](../README.md) | README principal del proyecto |
| [CLAUDE.md](../CLAUDE.md) | Instrucciones para Claude Code |

---

## Por Categoría de Uso

### Para Nuevos Desarrolladores
1. [specs/01_RESUMEN_EJECUTIVO.md](specs/01_RESUMEN_EJECUTIVO.md) - Entender el proyecto
2. [README.md](../README.md) - Configuración inicial
3. [api/QUICKSTART.md](api/QUICKSTART.md) - Conectar con el backend
4. [guides/MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md) - Patrones de desarrollo

### Para Implementar Features
1. [MATRIZ_IMPLEMENTACION.md](MATRIZ_IMPLEMENTACION.md) - Ver qué falta
2. [implementation/PLAN_IMPLEMENTACION.md](implementation/PLAN_IMPLEMENTACION.md) - Plan general
3. [specs/06_MODULOS_FUNCIONALES.md](specs/06_MODULOS_FUNCIONALES.md) - Especificaciones
4. [api/API_REFERENCE.md](api/API_REFERENCE.md) - Endpoints disponibles

### Para Entender el Sistema de Permisos
1. [specs/07_MATRIZ_PERMISOS.md](specs/07_MATRIZ_PERMISOS.md) - Matriz base
2. [specs/MATRIZ_PERMISOS_COMPLETA.md](specs/MATRIZ_PERMISOS_COMPLETA.md) - Detalle completo
3. [CLAUDE.md](../CLAUDE.md) - Implementación en código

### Para Trabajar con la API
1. [api/AUTHENTICATION.md](api/AUTHENTICATION.md) - Autenticación
2. [api/API_REFERENCE.md](api/API_REFERENCE.md) - Referencia completa
3. [api/EXAMPLES.md](api/EXAMPLES.md) - Ejemplos prácticos

### Para Configurar Claude Code
1. [setup/CLAUDE_CODE_SETUP.md](setup/CLAUDE_CODE_SETUP.md) - Setup completo
2. [CLAUDE.md](../CLAUDE.md) - Instrucciones del proyecto

---

## Convenciones de Documentación

- **Idioma**: Español (código y variables en inglés)
- **Formato**: Markdown (GitHub Flavored)
- **Nomenclatura**: UPPER_SNAKE_CASE para documentos principales

---

## Actualización

Esta documentación se actualiza con cada implementación significativa.

**Última actualización**: Diciembre 2024

---

*Proyecto: SIGP Frontend - Sistema Integrado de Gestión de Proyectos*
*Organización: INEI*
