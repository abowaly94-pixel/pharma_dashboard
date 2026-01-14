import { type ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, type LucideIcon } from 'lucide-react';

type StateVariant = 'loading' | 'empty' | 'error';

interface StateViewProps {
  variant: StateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function StateView({ variant, title, description, icon, action, className }: StateViewProps) {
  const defaultConfig: Record<StateVariant, { title: string; description?: string; icon: LucideIcon; iconClassName: string }> = {
    loading: {
      title: 'جاري التحميل...',
      description: 'يرجى الانتظار',
      icon: Loader2,
      iconClassName: 'animate-spin text-primary',
    },
    empty: {
      title: 'لا توجد بيانات',
      description: undefined,
      icon: Inbox,
      iconClassName: 'text-muted-foreground/70',
    },
    error: {
      title: 'حدث خطأ',
      description: 'تعذر تحميل البيانات، حاول مرة أخرى',
      icon: AlertTriangle,
      iconClassName: 'text-destructive/80',
    },
  };

  const config = defaultConfig[variant];
  const Icon = icon ?? config.icon;

  return (
    <div className={className} dir="rtl">
      <div className="text-center">
        <Icon className={`w-12 h-12 mx-auto mb-3 ${variant === 'loading' ? config.iconClassName : config.iconClassName}`} />
        <p className="font-cairo font-medium text-foreground">{title ?? config.title}</p>
        {(description ?? config.description) && (
          <p className="mt-1 text-sm text-muted-foreground font-cairo">{description ?? config.description}</p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

interface TableStateRowProps extends Omit<StateViewProps, 'className'> {
  colSpan: number;
}

export function TableStateRow({ colSpan, ...stateProps }: TableStateRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12">
        <StateView {...stateProps} />
      </td>
    </tr>
  );
}
