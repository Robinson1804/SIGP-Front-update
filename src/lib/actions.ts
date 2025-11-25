
'use server';

import { redirect } from 'next/navigation';
import { LoginFormSchema, type LoginFormState } from '@/lib/definitions';

// Mock CAPTCHA value
const MOCK_CAPTCHA_CODE = 'A4B2C'; 

// This is a mock user database. In a real app, you'd query your database or API.
const users = [
  { username: 'pmo', password: 'password', role: 'PMO' },
  { username: 'admin', password: 'password', role: 'Administrator' },
  { username: 'coord', password: 'password', role: 'Coordinator' },
  { username: 'scrum', password: 'password', role: 'Scrum Master' },
  { username: 'dev', password: 'password', role: 'Developer' },
  { username: 'user', password: 'password', role: 'User' },
];

export async function authenticate(
  prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

  const validatedFields = LoginFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrija los errores en el formulario.',
    };
  }

  const { username, password, captcha } = validatedFields.data;

  if (captcha.toUpperCase() !== MOCK_CAPTCHA_CODE) {
    return {
      errors: { captcha: ['Código captcha incorrecto.'] },
      message: 'Error de validación.',
    };
  }

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (!user || user.password !== password) {
    return {
      message: 'Credenciales inválidas. Por favor, inténtelo de nuevo.',
    };
  }
  
  // In a real app, you would set an HTTP-only cookie for session management.
  
  switch (user.role) {
    case 'PMO':
      redirect('/pgd');
    // Add other role redirects here
    // case 'Administrator':
    //   redirect('/admin-dashboard');
    // ...
    default:
      // Fallback for demo purposes
      redirect('/pgd');
  }
}

export async function signOut() {
  // In a real app, you would clear the session cookie here.
  redirect('/');
}
