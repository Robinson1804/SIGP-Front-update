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
