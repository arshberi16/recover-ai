import React from 'react';
import { clsx } from 'clsx';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("fintech-card p-5", className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4", className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={clsx("text-base font-semibold text-slate-900 dark:text-slate-100", className)}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={clsx("text-xs text-slate-500 dark:text-slate-400 mt-0.5", className)}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);
