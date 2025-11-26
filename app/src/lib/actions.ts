
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
  // The redirect will happen on the server side now.
  
  let targetPath = '/';
  switch (user.role) {
    case 'PMO':
      targetPath = '/pgd';
      break;
    case 'Scrum Master':
      targetPath = '/poi';
      break;
    case 'Administrator':
      targetPath = '/pgd'; // Fallback for demo
      break;
    case 'Coordinator':
      targetPath = '/poi'; // Fallback for demo
      break;
    case 'Developer':
      targetPath = '/poi'; // Fallback for demo
      break;
    case 'User':
      targetPath = '/poi'; // Fallback for demo
      break;
    default:
      targetPath = '/pgd'; // Default fallback
      break;
  }
  
  redirect(targetPath);
}

export async function signOut() {
  // In a real app, you would clear the session cookie here.
  redirect('/');
}
