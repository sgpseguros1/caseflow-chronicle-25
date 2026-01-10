import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const getPasswordStrength = (password: string): { strength: number; label: string } => {
  let strength = 0;
  
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^A-Za-z0-9]/.test(password)) strength += 25;
  
  const labels: Record<number, string> = {
    0: 'Muito fraca',
    25: 'Fraca',
    50: 'Média',
    75: 'Forte',
    100: 'Muito forte',
  };
  
  return { strength, label: labels[strength] || 'Fraca' };
};
