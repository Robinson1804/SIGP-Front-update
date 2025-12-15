---
allowed-tools: Read, Write, Edit, Glob, Grep
argument-hint: [EntityName] [--scrum|--kanban]
description: Genera CRUD completo para entidades SIGP con permisos, tipos y Server Actions
---

## SIGP CRUD Generator

**Entity**: $ARGUMENTS

## Análisis del Proyecto SIGP

### 1. Leer Contexto del Proyecto
- CLAUDE.md: @CLAUDE.md
- Tipos existentes: @src/lib/definitions.ts
- Permisos: @src/lib/permissions.ts
- Rutas: @src/lib/paths.ts
- Actions existentes: @src/lib/actions.ts

### 2. Determinar Módulo y Permisos

Basado en el nombre de la entidad, determina:
- **Módulo**: ¿Es PGD, POI, RRHH, Dashboard, Notificaciones?
- **Tipo POI**: Si es POI, ¿es Proyecto (Scrum) o Actividad (Kanban)?
- **Roles que pueden**: Ver, Crear, Editar, Eliminar

### 3. Estructura de Archivos a Generar

```
src/
├── app/
│   └── [modulo]/
│       └── [entity-plural]/
│           ├── page.tsx              # Lista (Server Component)
│           ├── [id]/
│           │   └── page.tsx          # Detalles (Server Component)
│           ├── nuevo/
│           │   └── page.tsx          # Crear (Client Component)
│           └── [id]/editar/
│               └── page.tsx          # Editar (Client Component)
├── components/
│   └── [modulo]/
│       ├── [entity]-card.tsx         # Card component
│       ├── [entity]-form.tsx         # Formulario reutilizable
│       ├── [entity]-list.tsx         # Lista component
│       └── [entity]-filters.tsx      # Filtros
└── lib/
    ├── definitions.ts                # Agregar tipos
    ├── paths.ts                      # Agregar rutas
    └── actions.ts                    # Agregar Server Actions
```

## 4. Generación de Tipos TypeScript

```typescript
// src/lib/definitions.ts - Agregar al final del archivo

// ============================================
// [ENTITY] Types
// ============================================

export interface [Entity] {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: [Entity]Estado;
  // ... campos específicos basados en backend schema

  // Auditoría
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export type [Entity]Estado =
  | 'Pendiente'
  | 'En proceso'
  | 'Completado'
  | 'Cancelado';

export interface Create[Entity]Input {
  nombre: string;
  descripcion?: string;
  // ... campos requeridos
}

export interface Update[Entity]Input extends Partial<Create[Entity]Input> {
  id: number;
}
```

## 5. Actualizar Rutas

```typescript
// src/lib/paths.ts - Agregar al objeto paths

export const paths = {
  // ... rutas existentes

  [moduloName]: {
    // ... rutas existentes del módulo

    [entityPlural]: {
      base: '/[modulo]/[entity-plural]',
      nuevo: '/[modulo]/[entity-plural]/nuevo',
      detalles: (id: number) => `/[modulo]/[entity-plural]/${id}`,
      editar: (id: number) => `/[modulo]/[entity-plural]/${id}/editar`,
    },
  },
};
```

## 6. Server Actions

```typescript
// src/lib/actions.ts - Agregar al final

// ============================================
// [Entity] Actions
// ============================================

'use server';

import { revalidatePath } from 'next/cache';
import type { [Entity], Create[Entity]Input, Update[Entity]Input } from './definitions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

/**
 * Obtiene todas las [entities]
 */
export async function get[Entities](): Promise<[Entity][]> {
  try {
    const token = await getAuthToken(); // Implementar según sistema auth

    const response = await fetch(`${API_BASE}/api/v1/[entity-plural]`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // O usar tags para revalidación
    });

    if (!response.ok) {
      throw new Error(`Error fetching [entities]: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data; // Ajustar según formato backend
  } catch (error) {
    console.error('Error in get[Entities]:', error);
    throw error;
  }
}

/**
 * Obtiene una [entity] por ID
 */
export async function get[Entity](id: number): Promise<[Entity]> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/[entity-plural]/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('[Entity] no encontrada');
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error in get[Entity] ${id}:`, error);
    throw error;
  }
}

/**
 * Crea una nueva [entity]
 */
export async function create[Entity](input: Create[Entity]Input): Promise<[Entity]> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/[entity-plural]`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear [entity]');
    }

    const data = await response.json();

    // Revalidar cache
    revalidatePath('/[modulo]/[entity-plural]');

    return data.data || data;
  } catch (error) {
    console.error('Error in create[Entity]:', error);
    throw error;
  }
}

/**
 * Actualiza una [entity]
 */
export async function update[Entity](input: Update[Entity]Input): Promise<[Entity]> {
  try {
    const token = await getAuthToken();
    const { id, ...updateData } = input;

    const response = await fetch(`${API_BASE}/api/v1/[entity-plural]/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar [entity]');
    }

    const data = await response.json();

    // Revalidar cache
    revalidatePath('/[modulo]/[entity-plural]');
    revalidatePath(`/[modulo]/[entity-plural]/${id}`);

    return data.data || data;
  } catch (error) {
    console.error(`Error in update[Entity] ${input.id}:`, error);
    throw error;
  }
}

/**
 * Elimina (soft delete) una [entity]
 */
export async function delete[Entity](id: number): Promise<void> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/[entity-plural]/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar [entity]');
    }

    // Revalidar cache
    revalidatePath('/[modulo]/[entity-plural]');
  } catch (error) {
    console.error(`Error in delete[Entity] ${id}:`, error);
    throw error;
  }
}
```

## 7. Página de Lista (Server Component)

```typescript
// src/app/[modulo]/[entity-plural]/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/permission-gate';
import { [Entity]List } from '@/components/[modulo]/[entity]-list';
import { get[Entities] } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

export const metadata = {
  title: '[Entities] | SIGP',
  description: 'Gestión de [entities]',
};

export default async function [Entities]Page() {
  const [entities] = await get[Entities]();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">[Entities]</h1>
          <p className="text-muted-foreground">
            Gestiona las [entities] del sistema
          </p>
        </div>

        <PermissionGate
          module={MODULES.[MODULO]}
          permission={PERMISSIONS.CREATE}
        >
          <Button asChild>
            <Link href={paths.[modulo].[entityPlural].nuevo}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva [Entity]
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Lista */}
      <Suspense fallback={<[Entity]ListSkeleton />}>
        <[Entity]List data={[entities]} />
      </Suspense>
    </div>
  );
}

function [Entity]ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
```

## 8. Componente de Lista

```typescript
// src/components/[modulo]/[entity]-list.tsx

'use client';

import { useState } from 'react';
import { [Entity]Card } from './[entity]-card';
import { [Entity]Filters } from './[entity]-filters';
import type { [Entity] } from '@/lib/definitions';

interface [Entity]ListProps {
  data: [Entity][];
}

export function [Entity]List({ data }: [Entity]ListProps) {
  const [filteredData, setFilteredData] = useState(data);

  const handleFilter = (filters: any) => {
    // Implementar lógica de filtrado
    const filtered = data.filter((item) => {
      // Lógica de filtrado según filtros
      return true;
    });
    setFilteredData(filtered);
  };

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No se encontraron [entities]
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <[Entity]Filters onFilter={handleFilter} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((item) => (
          <[Entity]Card key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
}
```

## 9. Componente Card

```typescript
// src/components/[modulo]/[entity]-card.tsx

'use client';

import Link from 'next/link';
import { MoreVertical, Edit, Trash } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/permission-gate';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';
import type { [Entity] } from '@/lib/definitions';

interface [Entity]CardProps {
  data: [Entity];
}

export function [Entity]Card({ data }: [Entity]CardProps) {
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta [entity]?')) return;

    try {
      await delete[Entity](data.id);
      // Mostrar toast de éxito
    } catch (error) {
      // Mostrar toast de error
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <Link
              href={paths.[modulo].[entityPlural].detalles(data.id)}
              className="hover:underline"
            >
              {data.codigo} - {data.nombre}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {data.descripcion}
          </CardDescription>
        </div>

        <PermissionGate
          module={MODULES.[MODULO]}
          permission={PERMISSIONS.EDIT}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={paths.[modulo].[entityPlural].editar(data.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>

              <PermissionGate
                module={MODULES.[MODULO]}
                permission={PERMISSIONS.DELETE}
              >
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGate>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={
            data.estado === 'Completado' ? 'success' :
            data.estado === 'En proceso' ? 'default' :
            'secondary'
          }>
            {data.estado}
          </Badge>

          <span className="text-sm text-muted-foreground">
            {new Date(data.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 10. Formulario Reutilizable

```typescript
// src/components/[modulo]/[entity]-form.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { create[Entity], update[Entity] } from '@/lib/actions';
import { paths } from '@/lib/paths';
import type { [Entity] } from '@/lib/definitions';

const formSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  descripcion: z.string().optional(),
  // ... otros campos
});

type FormValues = z.infer<typeof formSchema>;

interface [Entity]FormProps {
  initialData?: [Entity];
  mode: 'create' | 'edit';
}

export function [Entity]Form({ initialData, mode }: [Entity]FormProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: '',
      descripcion: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === 'create') {
        await create[Entity](values);
        toast({
          title: 'Éxito',
          description: '[Entity] creada correctamente',
        });
      } else {
        await update[Entity]({ id: initialData!.id, ...values });
        toast({
          title: 'Éxito',
          description: '[Entity] actualizada correctamente',
        });
      }

      router.push(paths.[modulo].[entityPlural].base);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la [entity]" {...field} />
              </FormControl>
              <FormDescription>
                Nombre descriptivo de la [entity]
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción opcional"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agregar más campos según entidad */}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? 'Guardando...'
              : mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Checklist de Generación

Después de generar todo:

- [ ] Tipos agregados a `definitions.ts`
- [ ] Rutas agregadas a `paths.ts`
- [ ] Server Actions en `actions.ts`
- [ ] Página de lista creada
- [ ] Página de detalles creada
- [ ] Página de crear creada
- [ ] Página de editar creada
- [ ] Componente Card creado
- [ ] Componente Form creado
- [ ] Componente List creado
- [ ] Componente Filters creado
- [ ] PermissionGate integrado en acciones
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Toast notifications agregadas
- [ ] Validación con Zod
- [ ] TypeScript sin errores
- [ ] Tests básicos (opcional)

Genera todo el CRUD completo siguiendo exactamente esta estructura y los patrones del proyecto SIGP.
