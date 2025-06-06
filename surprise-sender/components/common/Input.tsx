
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  const baseStyles = "block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm text-text-primary disabled:opacity-50";
  
  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id || props.name} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        id={id || props.name}
        className={`${baseStyles} ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
