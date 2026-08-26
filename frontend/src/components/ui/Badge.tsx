import React from 'react';
import { clsx } from 'clsx';
import type { PriorityLevel, TransactionStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'high' | 'medium' | 'low' | 'failed' | 'recovered' | 'pending' | 'default' | 'outline' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full transition-colors";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs"
  };

  const variantClasses = {
    high: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
    medium: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
    low: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    failed: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300",
    recovered: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60",
    pending: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/60",
    purple: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60",
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    outline: "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  };

  return (
    <span className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}>
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ level: PriorityLevel }> = ({ level }) => {
  if (level === 'High') return <Badge variant="high">High Priority</Badge>;
  if (level === 'Medium') return <Badge variant="medium">Medium Priority</Badge>;
  return <Badge variant="low">Low Priority</Badge>;
};

export const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  if (status === 'Recovered') return <Badge variant="recovered">Recovered</Badge>;
  if (status === 'Pending Retry') return <Badge variant="pending">Pending Retry</Badge>;
  if (status === 'Failed') return <Badge variant="failed">Failed</Badge>;
  return <Badge variant="default">{status}</Badge>;
};
