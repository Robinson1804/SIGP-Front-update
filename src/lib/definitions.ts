import { z } from 'zod';

export const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Nombre de usuario es requerido.' }),
  password: z.string().min(1, { message: 'Contraseña es requerida.' }),
  captcha: z.string().min(1, { message: 'Código captcha es requerido.' }),
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
    responsible: string[];
    scrumMaster: string;
    years: string[];
    amount: number; // Changed from annualAmount to amount
    managementMethod: string;
    progress?: number;
}

export type Project = {
    id: string;
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
