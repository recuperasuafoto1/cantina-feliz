import { CardMetrica } from '@/components/CardMetrica';
import { StatusBadge } from '@/components/StatusBadge';
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function PainelDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-extrabold">Dashboard</h2>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardMetrica icone={DollarSign} valor="R$ 0" label="Vendas Hoje" cor="success" />
        <CardMetrica icone={Clock} valor="0" label="Pendentes" cor="warning" />
        <CardMetrica icone={CheckCircle} valor="0" label="Atendidos" cor="primary" />
        <CardMetrica icone={AlertTriangle} valor="0" label="Estoque Crítico" cor="destructive" />
      </div>

      {/* Últimos pedidos */}
      <div className="bg-card rounded-xl border p-4">
        <h3 className="font-bold mb-3">Últimos Pedidos</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum pedido ainda</p>
        </div>
      </div>
    </div>
  );
}
