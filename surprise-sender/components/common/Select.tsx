
import React from 'react';
import { SelectOption } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  options: SelectOption[];
  placeholder?: string; // Added placeholder prop
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  className = '',
  wrapperClassName = '',
  options,
  placeholder, // Destructure placeholder
  ...props
}) => {
  const baseStyles =
    'block w-full pl-3 pr-10 py-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm text-text-primary disabled:opacity-50 appearance-none';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id || props.name} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id || props.name}
          className={`${baseStyles} ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'} ${className}`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
