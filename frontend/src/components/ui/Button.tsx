import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5"
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500"
  };

  return (
    <button
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
};
