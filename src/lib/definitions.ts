import { z } from 'zod';

// ============================================
// SISTEMA DE ROLES Y PERMISOS
// ============================================

/**
 * Roles del sistema
 */
export const ROLES = {
  ADMIN: 'ADMIN',  // Administrador con acceso completo a todo el sistema
  PMO: 'PMO',
  SCRUM_MASTER: 'SCRUM_MASTER',
  DESARROLLADOR: 'DESARROLLADOR',
  IMPLEMENTADOR: 'IMPLEMENTADOR',
  COORDINADOR: 'COORDINADOR',
  USUARIO: 'USUARIO',
  PATROCINADOR: 'PATROCINADOR',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Módulos del sistema
 */
export const MODULES = {
  PGD: 'PGD',
  POI: 'POI',
  RECURSOS_HUMANOS: 'RECURSOS_HUMANOS',
  DASHBOARD: 'DASHBOARD',
  NOTIFICACIONES: 'NOTIFICACIONES',
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];

/**
 * Acciones/Permisos disponibles en cada módulo
 */
export const PERMISSIONS = {
  // Permisos generales
  VIEW: 'VIEW',           // Ver/Listar
  CREATE: 'CREATE',       // Crear
  EDIT: 'EDIT',           // Editar
  DELETE: 'DELETE',       // Eliminar
  EXPORT: 'EXPORT',       // Exportar datos

  // Permisos específicos POI
  MANAGE_BACKLOG: 'MANAGE_BACKLOG',       // Gestionar backlog
  MANAGE_SPRINTS: 'MANAGE_SPRINTS',       // Gestionar sprints
  ASSIGN_TASKS: 'ASSIGN_TASKS',           // Asignar tareas
  UPDATE_TASK_STATUS: 'UPDATE_TASK_STATUS', // Actualizar estado de tareas
  VIEW_REPORTS: 'VIEW_REPORTS',           // Ver reportes

  // Permisos específicos RRHH
  MANAGE_USERS: 'MANAGE_USERS',           // Gestionar usuarios
  ASSIGN_ROLES: 'ASSIGN_ROLES',           // Asignar roles

  // Permisos específicos PGD
  MANAGE_OBJECTIVES: 'MANAGE_OBJECTIVES', // Gestionar objetivos
  APPROVE_PROJECTS: 'APPROVE_PROJECTS',   // Aprobar proyectos
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Tipo para definir permisos por módulo
 */
export type ModulePermissions = {
  [key in Module]?: Permission[];
};

/**
 * Configuración de permisos por rol
 */
export type RolePermissionConfig = {
  [key in Role]: {
    modules: Module[];
    permissions: ModulePermissions;
  };
};

/**
 * Usuario autenticado
 */
export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  mustChangePassword?: boolean;
};

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

export const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Nombre de usuario es requerido.' }),
  password: z.string().min(1, { message: 'Contraseña es requerida.' }),
  // captcha: z.string().min(1, { message: 'Código captcha es requerido.' }),
});

export type LoginFormState = {
  message: string | null;
  errors?: {
    username?: string[];
    password?: string[];
    captcha?: string[];
  };
};

export type SubProject = {
    id: string;
    name: string;
    description: string;
    responsible: string[]; // IDs de personal (para guardar)
    responsibleNames?: string[]; // Nombres de personal (para mostrar)
    scrumMaster: string;
    years: string[];
    amount: number; // Changed from annualAmount to amount
    managementMethod: string;
    financialArea?: string[];
    progress?: number;
    status?: string; // Estado del subproyecto (Pendiente, En planificación, En desarrollo, Finalizado)
    coordinador?: string;    // nombre del coordinador (for display/select)
    coordinacion?: string;   // texto libre
    fechaInicio?: string;    // ISO date string YYYY-MM-DD
    fechaFin?: string;       // ISO date string YYYY-MM-DD
}

export type Subtask = {
    id: string;
    title: string;
    description?: string;
    state: 'Por hacer' | 'En progreso' | 'Completado' | 'En revisión';
    responsible: string[];
    priority: 'Alta' | 'Media' | 'Baja';
    startDate: string;
    endDate: string;
    informer?: string;
    attachments?: File[];
    parentTaskId: string;
};

export type Task = {
    id: string;
    title: string;
    description?: string;
    state: 'Por hacer' | 'En progreso' | 'Completado' | 'En revisión';
    responsible: string[];
    priority: 'Alta' | 'Media' | 'Baja';
    startDate: string;
    endDate: string;
    informer?: string;
    attachments?: File[];
    subtasks?: Subtask[];
};

export type Project = {
    id: string;
    code?: string;
    name: string;
    description: string;
    type: 'Proyecto' | 'Actividad';
    classification: 'Al ciudadano' | 'Gestion interna';
    status: 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado';
    scrumMaster: string;
    annualAmount: number;
    strategicAction: string;
    missingData?: boolean;
    coordination?: string;
    financialArea?: string[];
    coordinator?: string;
    responsibles?: string[];
    years?: string[];
    managementMethod?: string;
    subProjects?: SubProject[];
    startDate?: string;
    endDate?: string;
    gestor?: string;
};

// ============================================
// PROYECTO (POI - SCRUM) Types
// ============================================

/**
 * Estados posibles de un proyecto
 */
export type ProyectoEstado =
  | 'Pendiente'
  | 'En planificacion'
  | 'En desarrollo'
  | 'Finalizado'
  | 'Cancelado';

/**
 * Clasificación del proyecto
 */
export type ProyectoClasificacion =
  | 'Al ciudadano'
  | 'Gestion interna';

/**
 * Método de gestión del proyecto
 */
export type MetodoGestion = 'Scrum' | 'Kanban';

/**
 * Interfaz para usuario relacionado (coordinador, scrum master, etc.)
 */
export interface UsuarioRelacionado {
  id: number;
  email?: string;
  username?: string;
  nombre?: string;
  apellido?: string;
  personal?: {
    id: number;
    nombre: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  };
}

/**
 * Interfaz para Acción Estratégica relacionada
 */
export interface AccionEstrategicaRelacionada {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

/**
 * Interfaz completa de Proyecto basada en backend schema
 */
export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'Proyecto';
  clasificacion: ProyectoClasificacion | null;
  estado: ProyectoEstado;

  // Vinculación estratégica
  accionEstrategicaId: number | null;
  accionEstrategica?: AccionEstrategicaRelacionada | null;

  // Responsables
  coordinadorId: number | null;
  coordinador?: UsuarioRelacionado | null;
  scrumMasterId: number | null;
  scrumMaster?: UsuarioRelacionado | null;

  // Área Usuaria - Patrocinadores asignados
  areaUsuaria: number[] | null;

  // Financiero
  coordinacion: string | null;
  areasFinancieras: string[] | null;
  montoAnual: number | null;
  anios: number[] | null;

  // Fechas
  fechaInicio: string | null;
  fechaFin: string | null;

  // Metodología
  metodoGestion: MetodoGestion;

  // Auditoría
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

/**
 * Input para crear un proyecto
 */
export interface CreateProyectoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  clasificacion?: ProyectoClasificacion;
  accionEstrategicaId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  areaUsuaria?: number[];
  coordinacion?: string;
  areasFinancieras?: string[];
  montoAnual?: number;
  anios?: number[];
  fechaInicio?: string;
  fechaFin?: string;
}

/**
 * Input para actualizar un proyecto
 */
export interface UpdateProyectoInput extends Partial<CreateProyectoInput> {
  id: number;
  estado?: ProyectoEstado;
}

/**
 * Schema de validación para crear proyecto
 */
export const CreateProyectoSchema = z.object({
  codigo: z.string().optional(), // Autogenerado por el backend
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().optional(),
  clasificacion: z.enum(['Al ciudadano', 'Gestion interna']).optional(),
  accionEstrategicaId: z.number().int().positive().optional(),
  coordinadorId: z.number().int().positive().optional(),
  scrumMasterId: z.number().int().positive().optional(),
  areaUsuaria: z.array(z.number().int().positive()).optional(),
  coordinacion: z.string().max(100).optional(),
  areasFinancieras: z.array(z.string()).optional(),
  montoAnual: z.number().positive().optional(),
  anios: z.array(z.number().int().min(2024).max(2050)).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

/**
 * Schema de validacion para crear subproyecto
 */
export const CreateSubproyectoSchema = z.object({
  proyectoPadreId: z.number().int().positive('Debe seleccionar un proyecto padre'),
  codigo: z.string().optional(), // Autogenerado por el backend
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().optional(),
  clasificacion: z.enum(['Al ciudadano', 'Gestion interna']).optional(),
  coordinadorId: z.number().int().positive().optional(),
  scrumMasterId: z.number().int().positive().optional(),
  areaUsuaria: z.array(z.number().int().positive()).optional(),
  responsables: z.array(z.number().int().positive()).optional(), // IDs de desarrolladores asignados
  coordinacion: z.string().max(100).optional(),
  areaResponsable: z.string().max(200).optional(),
  areasFinancieras: z.array(z.string()).optional(),
  monto: z.number().positive().optional(),
  anios: z.array(z.number().int().min(2024).max(2050)).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

export type CreateSubproyectoInput = z.infer<typeof CreateSubproyectoSchema>;
