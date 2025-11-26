import { z } from 'zod';

export const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Nombre de usuario es requerido.' }),
  password: z.string().min(1, { message: 'Contraseña es requerida.' }),
  captcha: z.string().min(1, { message: 'Código captcha es requerido.' }),
});

export type LoginFormState = {
  success: boolean;
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
    responsible: string[];
    scrumMaster: string;
    years: string[];
    amount: number; // Changed from annualAmount to amount
    managementMethod: string;
    progress?: number;
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
    classification: 'Al ciudadano' | 'Gestión interna';
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
};
