import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {
 const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-3 text-base'
      : 'px-4 py-2 text-sm';
  const variantClasses =
    variant === 'secondary'
      ? 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
      : variant === 'ghost'
      ? 'bg-transparent text-slate-900 border-transparent hover:bg-slate-100'
      : 'bg-slate-800 text-white border-transparent hover:bg-slate-700';

  return (
    <button
      type={props.type || 'button'}
      className={`inline-flex items-center justify-center rounded-xl border font-semibold transition duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
