import { getPasswordStrength, validatePassword } from '@/lib/passwordValidation';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, label } = getPasswordStrength(password);
  const { errors } = validatePassword(password);

  const strengthColors: Record<number, string> = {
    0: 'bg-destructive',
    25: 'bg-destructive',
    50: 'bg-yellow-500',
    75: 'bg-green-400',
    100: 'bg-green-600',
  };

  const requirements = [
    { label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
    { label: 'Uma letra maiúscula', regex: /[A-Z]/ },
    { label: 'Um número', regex: /[0-9]/ },
    { label: 'Um caractere especial', regex: /[^A-Za-z0-9]/ },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-20">{label}</span>
      </div>
      
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.regex.test(password);
          return (
            <li
              key={req.label}
              className={`flex items-center gap-2 text-xs ${
                met ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              {met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
