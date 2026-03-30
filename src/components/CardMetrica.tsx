import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardMetricaProps {
  icone: LucideIcon;
  valor: string | number;
  label: string;
  cor?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

const coresIcone = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/50 text-secondary-foreground',
  success: 'bg-cantina-success/10 text-cantina-success',
  warning: 'bg-cantina-warning/10 text-cantina-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function CardMetrica({ icone: Icone, valor, label, cor = 'primary' }: CardMetricaProps) {
  return (
    <div className="rounded-xl bg-card border p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", coresIcone[cor])}>
          <Icone className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-card-foreground">{valor}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
