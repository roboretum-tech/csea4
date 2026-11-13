import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  toggleButtonClassName?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  leftIcon,
  containerClassName = '',
  className = '',
  toggleButtonClassName = '',
  disabled,
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-slate-400">
          {leftIcon}
        </div>
      )}

      <input
        {...inputProps}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={`w-full ${leftIcon ? 'pl-9' : 'pl-3'} pr-10 py-2 text-sm rounded-lg focus:outline-none transition ${className}`}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={0}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${toggleButtonClassName}`}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-amber-500 hover:text-amber-600" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default PasswordField;
