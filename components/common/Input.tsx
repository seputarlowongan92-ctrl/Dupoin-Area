import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactElement<{ className?: string }>;
  error?: string;
  id: string; 
}

const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  type = 'text',
  id,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';

  const inputType = isPasswordType && showPassword ? 'text' : type;

  const baseBgClass = className?.includes('bg-') ? '' : 'bg-white';
  const baseTextClass = className?.includes('text-') ? '' : 'text-[#45545C]';
  const baseBorderClass = className?.includes('border-') ? '' : 'border-gray-300';

  return (
    <div className={`mb-0 ${className?.includes('mb-') ? '' : ''}`}>
      {label && (
        <label htmlFor={id} className="block text-[#45545C] text-xs font-semibold mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(icon, { className: 'h-5 w-5 text-[#89939D]' })}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          className={`block w-full px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#08B9ED]/30 focus:border-[#08B9ED] transition-colors duration-200 text-sm placeholder:text-[#89939D]
            ${baseBgClass}
            ${baseTextClass}
            ${baseBorderClass}
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-[#F20D16] focus:ring-red-200' : ''}
            ${className || ''}
          `}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#89939D] hover:text-[#45545C] focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#F20D16]">{error}</p>}
    </div>
  );
};

export default Input;