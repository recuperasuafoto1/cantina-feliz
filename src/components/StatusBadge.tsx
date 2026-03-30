import { cn } from '@/lib/utils';

type StatusPedido = 'pendente' | 'em_preparacao' | 'pronto' | 'entregue' | 'cancelado';

interface StatusBadgeProps {
  status: StatusPedido;
}

const estilos: Record<StatusPedido, { classe: string; texto: string }> = {
  pendente: { classe: 'bg-cantina-warning/20 text-cantina-warning', texto: '⏳ Pendente' },
  em_preparacao: { classe: 'bg-cantina-info/20 text-cantina-info', texto: '🔄 Preparando' },
  pronto: { classe: 'bg-cantina-success/20 text-cantina-success', texto: '✅ Pronto' },
  entregue: { classe: 'bg-muted text-muted-foreground', texto: '📦 Entregue' },
  cancelado: { classe: 'bg-destructive/20 text-destructive', texto: '❌ Cancelado' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const estilo = estilos[status] || estilos.pendente;
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
      estilo.classe
    )}>
      {estilo.texto}
    </span>
  );
}
