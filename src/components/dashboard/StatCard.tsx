import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border border-border',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success/10 border border-success/20',
  warning: 'bg-warning/10 border border-warning/20',
  danger: 'bg-destructive/10 border border-destructive/20',
  info: 'bg-info/10 border border-info/20',
};

const iconStyles = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-destructive/20 text-destructive',
  info: 'bg-info/20 text-info',
};

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div
      className={cn(
        'stat-card rounded-xl',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
        
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p
          className={cn(
            'text-3xl font-bold tracking-tight',
            variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            'mt-1 text-sm',
            variant === 'primary'
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          )}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
