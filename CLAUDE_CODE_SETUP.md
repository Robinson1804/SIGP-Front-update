# 🚀 Claude Code Setup - SIGP Frontend

## Resumen Ejecutivo

Has configurado exitosamente un entorno avanzado de desarrollo con Claude Code para el proyecto SIGP Frontend. Este documento resume todo lo creado y cómo usarlo.

---

## 📦 Lo que Tienes Ahora

### 1. **CLAUDE.md** - Guía Principal del Proyecto
📍 Ubicación: `/CLAUDE.md`

**Qué es**: Documentación maestra que cualquier instancia de Claude Code lee automáticamente.

**Contiene**:
- Arquitectura del sistema (Scrum/Kanban dual)
- Comandos esenciales de desarrollo
- Sistema de permisos por rol
- Patrones de implementación
- Backend integration
- Gotchas comunes y soluciones

**Cuándo leerla**: Antes de empezar cualquier tarea nueva en el proyecto.

---

### 2. **SIGP_WORKFLOW_GUIDE.md** - Workflows Específicos
📍 Ubicación: `/.claude/SIGP_WORKFLOW_GUIDE.md`

**Qué es**: Guía paso a paso de cómo usar agentes y comandos para tareas específicas de SIGP.

**Contiene 6 secciones**:
1. **Fase 1 - Análisis**: Explore agent, architecture expert, context7
2. **Fase 2 - Generación**: Component generator, frontend-developer
3. **Fase 3 - Backend**: PostgreSQL MCP, API tester, fullstack-developer
4. **Fase 4 - UI/UX**: ui-ux-designer, componentes refinados
5. **Fase 5 - Testing**: Performance audit, test-engineer, code-reviewer
6. **Fase 6 - Refactoring**: DeepGraph, context-manager

**3 Workflows completos** listos para usar:
- Implementar módulo completo desde cero
- Solucionar bug de producción
- Optimizar performance

---

### 3. **Comandos Slash Personalizados**

#### A. `/sigp-crud-generator` - NUEVO ✨
📍 Ubicación: `/.claude/commands/sigp-crud-generator.md`

**Qué hace**: Genera un CRUD completo en 1 comando

**Uso**:
```bash
/sigp-crud-generator Proyecto

# Genera automáticamente:
# ✅ Tipos en definitions.ts
# ✅ Rutas en paths.ts
# ✅ Server Actions en actions.ts
# ✅ Página de lista (Server Component)
# ✅ Página de detalles
# ✅ Página de crear
# ✅ Página de editar
# ✅ Componente Card
# ✅ Componente Form (React Hook Form + Zod)
# ✅ Componente List
# ✅ Componente Filters
# ✅ PermissionGate integrado
# ✅ Loading states
# ✅ Error handling
```

**Casos de uso**:
- Crear módulo de Proyectos POI
- Crear módulo de Actividades
- Crear módulo de Personal (RRHH)
- Crear módulo de Objetivos (PGD)

#### B. `/sigp-validate-patterns` - NUEVO ✨
📍 Ubicación: `/.claude/commands/sigp-validate-patterns.md`

**Qué hace**: Valida que tu código siga los patrones del proyecto

**Uso**:
```bash
# Validar un archivo específico
/sigp-validate-patterns src/app/poi/page.tsx

# Validar un módulo completo
/sigp-validate-patterns poi

# Validar cambios recientes (últimos 5 commits)
/sigp-validate-patterns
```

**Qué valida**:
- ✅ Uso de `paths.ts` (no rutas hardcodeadas)
- ✅ Uso de `permissions.ts` (constantes, no strings)
- ✅ Tipos de `definitions.ts`
- ✅ Server vs Client Components correcto
- ✅ Dual system Scrum/Kanban respetado
- ✅ Estilos con Tailwind (no CSS modules)
- ✅ Accesibilidad (aria-labels, alt texts)
- ✅ No uso de `any` en TypeScript

**Output**: Reporte con errores, advertencias y puntuación de calidad.

#### C. Comandos Next.js Predefinidos

Ya tenías estos 5 comandos configurados:

1. `/nextjs-component-generator` - Genera componentes React
2. `/nextjs-performance-audit` - Auditoría de performance
3. `/nextjs-api-tester` - Testing de APIs
4. `/nextjs-middleware-creator` - Crear middleware
5. `/nextjs-migration-helper` - Ayuda en migraciones

---

### 4. **Agentes Especializados**

Tienes 9 agentes configurados:

| Agente | Cuándo Usar | Ejemplo de Prompt |
|--------|-------------|-------------------|
| **frontend-developer** | Componentes UI complejos | "Crea KanbanBoard con drag & drop usando @dnd-kit" |
| **nextjs-architecture-expert** | Decisiones arquitectónicas | "Diseña arquitectura del módulo Backlog" |
| **fullstack-developer** | Flujo completo front+back | "Implementa sistema de aprobación de actas" |
| **ui-ux-designer** | Diseño de interfaces | "Diseña dashboard POI con KPIs y gráficos" |
| **test-engineer** | Testing | "Crea suite de tests para sistema de permisos" |
| **code-reviewer** | Revisión de código | "Revisa módulo Backlog antes de commit" |
| **database-architect** | Diseño de BD | Ya tienes BD, pero útil para consultas |
| **context-manager** | Refactoring largo | "Trackea refactor de auth a Zustand" |
| **mcp-expert** | MCP servers | Configuración avanzada |

**Cómo usar agentes**:
Simplemente habla con Claude y menciona la tarea. Si hay un agente especializado, Claude lo invocará automáticamente.

---

### 5. **MCP Servers Configurados**

📍 Configuración: `/.mcp.json`

| Server | Estado | Uso |
|--------|--------|-----|
| **memory** | ✅ Activo | Mantiene contexto entre sesiones |
| **context7** | ✅ Activo | Context management avanzado |
| **postgresql** | ⚙️ Configurar | Acceso directo a BD (actualiza credenciales) |
| **DeepGraph Next.js** | ✅ Activo | Análisis de dependencias Next.js |
| **postman-api** | ⚙️ Opcional | Testing de APIs externas |
| **postgres-docs** | ⚙️ Opcional | Docs de PostgreSQL |

**Acción requerida para PostgreSQL MCP**:
```json
// .mcp.json - actualiza esta línea:
"POSTGRES_CONNECTION_STRING": "postgresql://sigp_user:sigp_pass@localhost:5432/sigp_db"
```

---

## 🎯 Cómo Empezar a Usar Todo Esto

### Escenario 1: "Quiero implementar el módulo de Proyectos POI"

```bash
# 1. Genera el CRUD base
/sigp-crud-generator Proyecto --scrum

# 2. Personaliza con agente frontend
"Agente frontend-developer: Toma el ProyectoCard generado y:
- Añade badge de estado con colores
- Agrega indicador de sprint activo
- Muestra progreso con barra
- Usa componentes de shadcn/ui"

# 3. Valida el código
/sigp-validate-patterns poi

# 4. Revisa antes de commit
"Agente code-reviewer: Revisa el módulo POI completo"
```

### Escenario 2: "Necesito crear el tablero Kanban para actividades"

```bash
# 1. Pide diseño
"Agente ui-ux-designer: Diseña tablero Kanban para actividades
con 4 columnas drag & drop, filtros y vista responsive"

# 2. Implementa el componente
"Agente frontend-developer: Implementa el diseño del tablero
usando @dnd-kit para drag & drop y Server Actions para persistir"

# 3. Optimiza performance
/nextjs-performance-audit tablero

# 4. Crea tests
"Agente test-engineer: Crea tests para el tablero Kanban"
```

### Escenario 3: "Hay un bug en el sistema de permisos"

```bash
# 1. Explora el código relacionado
"Agente Explore: Encuentra todos los archivos relacionados
con el sistema de permisos"

# 2. Analiza dependencias
# (Claude usará DeepGraph Next.js MCP automáticamente)
"Muestra qué componentes dependen de permissions.ts"

# 3. Fix el bug
# ... haces los cambios necesarios ...

# 4. Valida que no rompiste nada
/sigp-validate-patterns src/lib/permissions.ts

# 5. Crea test de regresión
"Agente test-engineer: Crea test que valide que este bug no se repita"
```

### Escenario 4: "Optimización de performance general"

```bash
# 1. Audit completo
/nextjs-performance-audit --all

# 2. Analiza bundle
# (El audit ya lo hace, pero puedes profundizar)
ANALYZE=true npm run build

# 3. Implementa optimizaciones sugeridas
"Agente frontend-developer: Según el reporte de performance,
optimiza el POIModal usando dynamic imports"

# 4. Re-audita
/nextjs-performance-audit --lighthouse
```

---

## 💡 Tips y Mejores Prácticas

### 1. **Lee CLAUDE.md Primero**
Antes de pedirle a Claude que implemente algo, él leerá automáticamente CLAUDE.md y entenderá el contexto del proyecto.

### 2. **Sé Específico con los Contextos**
```
❌ "Crea un componente de lista"

✅ "Crea ProyectosList siguiendo el patrón de CLAUDE.md:
   - Server Component
   - Usa getProyectos de actions.ts
   - Aplica PermissionGate para el módulo POI
   - Usa ProyectoCard para cada item"
```

### 3. **Combina Agentes y Comandos**
```
# Workflow óptimo:
1. /sigp-crud-generator → Genera base
2. frontend-developer → Refina UI
3. /sigp-validate-patterns → Valida
4. code-reviewer → Revisa
```

### 4. **Usa Context Managers para Tareas Largas**
```
"Agente context-manager: Voy a refactorizar el sistema de auth
en múltiples sesiones. Trackea:
- Sesión 1: Análisis actual
- Sesión 2: Diseño nuevo
- Sesión 3-4: Implementación
- Sesión 5: Testing"
```

### 5. **Valida Frecuentemente**
```bash
# Después de cada feature
/sigp-validate-patterns [módulo]

# Antes de cada commit
"Agente code-reviewer: Revisa cambios"

# Semanalmente
/nextjs-performance-audit --all
```

---

## 🛠️ Configuración Adicional Recomendada

### 1. Actualizar PostgreSQL MCP
```json
// .mcp.json
{
  "postgresql": {
    "env": {
      "POSTGRES_CONNECTION_STRING": "postgresql://sigp_user:sigp_pass@localhost:5432/sigp_db"
    }
  }
}
```

### 2. Crear Alias de Comandos (opcional)
```bash
# En tu .bashrc o .zshrc
alias sigp-new-module="/sigp-crud-generator"
alias sigp-check="/sigp-validate-patterns"
alias sigp-perf="/nextjs-performance-audit --all"
```

### 3. Pre-commit Hook (recomendado)
```bash
# .husky/pre-commit
#!/bin/sh
echo "Validando patrones SIGP..."
# Aquí podrías ejecutar validaciones automáticas
```

---

## 📊 Métricas de Éxito

Monitorea que el setup esté funcionando:

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| Velocidad de desarrollo | 50% más rápido | Features implementadas por semana |
| Calidad de código | Score > 85 | `/sigp-validate-patterns` |
| Performance | Lighthouse > 90 | `/nextjs-performance-audit` |
| Consistencia | 100% patterns | Code reviews pasan en 1er intento |
| Tests | Coverage > 80% | `npm run test:coverage` |

---

## 🚨 Troubleshooting

### "Claude no respeta los patrones del proyecto"
✅ **Solución**: Recuérdale explícitamente leer CLAUDE.md
```
"Lee CLAUDE.md antes de empezar. Sigue los patrones de paths.ts,
permissions.ts y definitions.ts"
```

### "El comando /sigp-crud-generator no funciona"
✅ **Solución**: Asegúrate de estar en la raíz del proyecto
```bash
pwd  # Debe ser: E:\Sistema de Gestion de Proyectos\sigp-frontend
```

### "MCP PostgreSQL no conecta"
✅ **Solución**: Verifica credenciales en .mcp.json y que PostgreSQL esté corriendo
```bash
# Verifica que el backend está corriendo
curl http://localhost:3010/api/v1/health
```

### "Los agentes no se invocan automáticamente"
✅ **Solución**: Los agentes son invocados según descripción. Puedes invocarlos explícitamente:
```
"Usa el agente frontend-developer para crear..."
```

---

## 🎓 Recursos de Aprendizaje

1. **Documentación del Proyecto**:
   - `CLAUDE.md` - Guía principal
   - `.claude/SIGP_WORKFLOW_GUIDE.md` - Workflows
   - `docs/specs/` - Especificaciones completas

2. **Claude Code Docs**:
   - Pregunta: "¿Cómo funcionan los agentes en Claude Code?"
   - Pregunta: "¿Cómo crear comandos slash personalizados?"

3. **Next.js + SIGP**:
   - Backend Swagger: `http://localhost:3010/api/docs`
   - Next.js Docs: `https://nextjs.org/docs`

---

## ✅ Checklist de Setup Completo

- [x] CLAUDE.md creado
- [x] SIGP_WORKFLOW_GUIDE.md creado
- [x] /sigp-crud-generator creado
- [x] /sigp-validate-patterns creado
- [x] 9 agentes configurados
- [x] 6 MCP servers configurados
- [ ] PostgreSQL MCP actualizado con tus credenciales ⚠️
- [ ] Pre-commit hook configurado (opcional)
- [ ] Alias de comandos creados (opcional)

---

## 🚀 Próximos Pasos

1. **Actualiza credenciales de PostgreSQL** en `.mcp.json`
2. **Prueba el CRUD generator**:
   ```bash
   /sigp-crud-generator TestEntity
   ```
3. **Valida un archivo**:
   ```bash
   /sigp-validate-patterns src/app/login/page.tsx
   ```
4. **Implementa tu primer módulo** usando el workflow de la guía
5. **Haz un performance audit**:
   ```bash
   /nextjs-performance-audit --all
   ```

---

**¡Todo listo!** Ahora tienes un entorno de desarrollo supercharged para SIGP Frontend. 🎉

**Pregunta si tienes dudas sobre**:
- Cómo usar un agente específico
- Cómo personalizar un comando
- Cómo crear tu propio workflow
- Cómo integrar con tu flujo de trabajo actual

---

**Creado**: Diciembre 2024
**Versión**: 1.0
**Proyecto**: SIGP Frontend - Sistema Integrado de Gestión de Proyectos
