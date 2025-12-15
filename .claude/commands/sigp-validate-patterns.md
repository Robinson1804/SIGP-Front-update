---
allowed-tools: Read, Grep, Glob
argument-hint: [file-path or module-name]
description: Valida que el código siga los patrones y convenciones del proyecto SIGP
---

## SIGP Pattern Validator

**Target**: $ARGUMENTS

## Validación Automática de Patrones SIGP

### 1. Leer Documentación del Proyecto
- Guía principal: @CLAUDE.md
- Workflow: @.claude/SIGP_WORKFLOW_GUIDE.md
- Tipos: @src/lib/definitions.ts
- Permisos: @src/lib/permissions.ts
- Rutas: @src/lib/paths.ts

### 2. Determinar Archivos a Validar

Si se proporciona un archivo específico:
- Validar solo ese archivo

Si se proporciona un módulo (ej: "poi", "pgd"):
- Encontrar todos los archivos del módulo: !`find src -path "*/${modulo}/*" -type f \( -name "*.tsx" -o -name "*.ts" \)`

Si no se proporciona nada:
- Validar archivos modificados recientemente: !`git diff --name-only HEAD~5 | grep -E "\.(tsx?|jsx?)$"`

### 3. Checklist de Validación por Archivo

#### A. Validación de Imports

**❌ Anti-Patterns a detectar:**
```typescript
// Rutas hardcodeadas
<Link href="/poi/proyecto/backlog">

// Imports de tipos desde archivos equivocados
import { Proyecto } from './types';

// Imports sin alias @
import { Button } from '../../../components/ui/button';

// Fetch directo en Client Components
fetch('http://localhost:3010/api/proyectos')
```

**✅ Patterns correctos:**
```typescript
// Uso de paths.ts
import { paths } from '@/lib/paths';
<Link href={paths.poi.proyecto.backlog.base}>

// Tipos desde definitions.ts
import type { Proyecto } from '@/lib/definitions';

// Alias @ para imports
import { Button } from '@/components/ui/button';

// Server Actions en vez de fetch
import { getProyectos } from '@/lib/actions';
```

**Validación a ejecutar:**
```bash
# Buscar rutas hardcodeadas
!`grep -n "href=['\"]/" $FILE | grep -v "paths\." || echo "✓ No hay rutas hardcodeadas"`

# Buscar fetch directo
!`grep -n "fetch(" $FILE | grep -v "actions.ts" || echo "✓ No hay fetch directo en componentes"`

# Buscar imports sin alias
!`grep -n "from ['\"]\.\./" $FILE || echo "✓ Todos los imports usan alias @"`
```

#### B. Validación de Permisos

**Checklist:**
- [ ] Rutas protegidas tienen `PermissionGate`
- [ ] Botones de acciones (Crear, Editar, Eliminar) tienen `PermissionGate`
- [ ] Usa constantes `MODULES` y `PERMISSIONS`, no strings
- [ ] Permisos correctos según rol (ver ROLE_PERMISSIONS)

**Búsqueda de anti-patterns:**
```bash
# Buscar strings literales de módulos
!`grep -n "module=['\"]" $FILE | grep -v "MODULES\." || echo "✓ Usa constantes MODULES"`

# Buscar strings literales de permisos
!`grep -n "permission=['\"]" $FILE | grep -v "PERMISSIONS\." || echo "✓ Usa constantes PERMISSIONS"`

# Verificar que botones de acción tienen PermissionGate
!`grep -B5 -A2 "Crear\|Editar\|Eliminar" $FILE | grep "PermissionGate" || echo "⚠ Revisar permisos en botones"`
```

**Ejemplo de validación de permisos:**
```typescript
// ❌ MAL - String literal
<PermissionGate module="POI" permission="CREATE">

// ✅ BIEN - Constantes
import { MODULES, PERMISSIONS } from '@/lib/definitions';
<PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
```

#### C. Validación de Tipos TypeScript

**Checklist:**
- [ ] No usa `any`
- [ ] Interfaces y types definidos en definitions.ts
- [ ] Props de componentes tienen type/interface
- [ ] Server Actions tienen tipos de retorno explícitos
- [ ] Enums usan los del proyecto, no crea nuevos

**Búsqueda:**
```bash
# Buscar uso de any
!`grep -n ": any" $FILE || echo "✓ No usa any"`

# Buscar definiciones de tipos locales (debería estar en definitions.ts)
!`grep -n "^export interface\|^export type" $FILE | grep -v "Props\|FormValues" || echo "ℹ Revisar si tipos deberían estar en definitions.ts"`

# Buscar enums locales
!`grep -n "^export enum" $FILE || echo "✓ No define enums locales"`
```

#### D. Validación de Componentes Next.js

**Para Server Components:**
```bash
# Verificar que NO tiene 'use client'
!`grep -n "^'use client'" $FILE && echo "⚠ Es Server Component pero tiene 'use client'" || echo "✓ Server Component correcto"`

# Verificar que usa async si hace data fetching
!`grep -n "export default async function" $FILE || echo "ℹ Server Component sin async (OK si no fetch)"`

# No debe usar hooks
!`grep -n "useState\|useEffect\|useRouter" $FILE && echo "❌ Server Component NO puede usar hooks" || echo "✓ No usa hooks"`
```

**Para Client Components:**
```bash
# Debe tener 'use client'
!`grep -n "^'use client'" $FILE || echo "⚠ Client Component debería tener 'use client'"`

# Puede usar hooks
!`grep -n "useState\|useEffect" $FILE && echo "✓ Usa hooks correctamente" || echo "ℹ No usa hooks (OK si no es necesario)"`
```

#### E. Validación de Dual System (Scrum/Kanban)

**Solo para archivos relacionados con POI:**

Si el archivo menciona "Proyecto" o "Sprint" o "Historia Usuario":
```bash
!`grep -n "Proyecto\|Sprint\|HistoriaUsuario" $FILE && echo "📋 Modo SCRUM detectado" || echo ""`
```

**Validaciones específicas SCRUM:**
- [ ] NO menciona "Subtarea"
- [ ] Menciona "Historia de Usuario"
- [ ] Menciona "Sprint"

```bash
!`grep -n "Subtarea" $FILE && echo "❌ SCRUM NO debe tener subtareas" || echo "✓ No usa subtareas (correcto para Scrum)"`
```

Si el archivo menciona "Actividad" o "Tarea" (sin Sprint):
```bash
!`grep -n "Actividad" $FILE && echo "📋 Modo KANBAN detectado" || echo ""`
```

**Validaciones específicas KANBAN:**
- [ ] NO menciona "Sprint"
- [ ] NO menciona "Historia de Usuario"
- [ ] PUEDE mencionar "Subtarea"

```bash
!`grep -n "Sprint\|HistoriaUsuario" $FILE && echo "❌ KANBAN NO usa Sprints ni HUs" || echo "✓ No mezcla conceptos de Scrum"`
```

#### F. Validación de Estilos

**Checklist:**
- [ ] Usa Tailwind CSS classes
- [ ] No crea archivos CSS custom (excepto globals.css)
- [ ] Usa variables CSS de globals.css para colores
- [ ] Componentes shadcn/ui sin modificaciones inline

**Búsqueda:**
```bash
# Buscar estilos inline
!`grep -n 'style={{' $FILE && echo "⚠ Prefiere Tailwind sobre estilos inline" || echo "✓ No usa estilos inline"`

# Buscar imports de CSS modules
!`grep -n "\.module\.css" $FILE && echo "⚠ SIGP usa Tailwind, no CSS modules" || echo "✓ Usa Tailwind"`

# Buscar colores hardcodeados
!`grep -n "#[0-9a-fA-F]\{6\}\|rgb\|rgba" $FILE && echo "ℹ Considera usar variables CSS de globals.css" || echo "✓ No usa colores hardcodeados"`
```

#### G. Validación de Accesibilidad

**Checklist:**
- [ ] Botones tienen aria-label si solo tienen icono
- [ ] Imágenes tienen alt text
- [ ] Formularios tienen labels
- [ ] Elementos interactivos tienen estados de focus

**Búsqueda:**
```bash
# Buscar botones con solo icono sin aria-label
!`grep -B2 '<Button' $FILE | grep -A2 'Icon' | grep -v 'aria-label' && echo "⚠ Botones con icono deberían tener aria-label" || echo "✓ Botones accesibles"`

# Buscar imágenes sin alt
!`grep -n '<img' $FILE | grep -v 'alt=' && echo "❌ Imágenes deben tener alt text" || echo "✓ Imágenes con alt"`

# Buscar Image de Next.js sin alt
!`grep -n '<Image' $FILE | grep -v 'alt=' && echo "❌ Image debe tener alt text" || echo "✓ Images con alt"`
```

### 4. Reporte de Validación

Genera un reporte estructurado:

```markdown
# Reporte de Validación: [ARCHIVO]

## ✅ Validaciones Exitosas
- Usa paths.ts para rutas
- Permisos con constantes
- No usa `any` en TypeScript
- Server Component correctamente implementado

## ⚠️  Advertencias
- [ ] Línea 45: Botón con icono sin aria-label
- [ ] Línea 78: Color hardcodeado, usar variable CSS

## ❌ Errores Críticos
- [ ] Línea 23: Ruta hardcodeada `/poi/proyecto`
      Solución: import { paths } from '@/lib/paths';
                <Link href={paths.poi.proyecto.detalles}>

- [ ] Línea 67: Server Component usa useState
      Solución: Mover a Client Component o eliminar estado

## 📊 Estadísticas
- Total líneas: 234
- Imports: 12
- Componentes: 3
- Hooks: 0 (correcto para Server Component)

## 🎯 Puntuación de Calidad
**85/100** - Bueno (necesita correcciones menores)

### Siguiente Acción Recomendada
1. Corregir rutas hardcodeadas
2. Agregar aria-labels faltantes
3. Ejecutar `npm run lint` para validar TypeScript
```

### 5. Validaciones Específicas por Tipo de Archivo

#### Para `page.tsx` (Server Components):
- Debe exportar metadata (opcional pero recomendado)
- Debe ser async si hace data fetching
- No debe tener 'use client'
- Debe usar PermissionGate para proteger contenido

#### Para `layout.tsx`:
- Debe recibir children
- No debe tener 'use client' (excepto casos específicos)
- Debe manejar metadata

#### Para archivos en `/components`:
- Debe tener 'use client' si usa hooks
- Debe tener interface Props si recibe props
- Debe exportar por defecto el componente

#### Para `/lib/actions.ts`:
- Debe tener 'use server' al inicio
- Funciones async
- Debe hacer revalidatePath después de mutaciones
- Manejo de errores con try/catch

### 6. Validación Batch (múltiples archivos)

Si validas un módulo completo:

```bash
# Encontrar todos los archivos del módulo
FILES=$(find src/app/poi -name "*.tsx")

# Validar cada uno
for file in $FILES; do
  echo "Validando: $file"
  # Ejecutar validaciones
done

# Generar reporte consolidado
```

### 7. Auto-Fix (opcional)

Para ciertos errores, sugerir o aplicar fix automático:

**Ejemplo: Convertir rutas hardcodeadas**
```bash
# Detectar
grep -n "href=\"/poi" src/app/poi/page.tsx

# Sugerir fix
echo "Replace: href=\"/poi/proyecto/backlog\""
echo "With: href={paths.poi.proyecto.backlog.base}"
```

## Ejecución del Comando

**Validar un archivo:**
```
/sigp-validate-patterns src/app/poi/page.tsx
```

**Validar un módulo:**
```
/sigp-validate-patterns poi
```

**Validar cambios recientes:**
```
/sigp-validate-patterns
```

**Output esperado:**
- Reporte detallado de validación
- Lista de errores y advertencias
- Sugerencias de corrección
- Puntuación de calidad del código
- Siguiente paso recomendado
