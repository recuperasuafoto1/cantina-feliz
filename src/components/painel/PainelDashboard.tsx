import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Clock, CheckCircle, AlertTriangle, Package, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export function PainelDashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Buscar pedidos de hoje
      const { data: pedidosHoje, error: errorPedidos } = await supabase
        .from('pedidos')
        .select('*')
        .gte('criado_em', `${today}T00:00:00.000Z`)
        .lte('criado_em', `${today}T23:59:59.999Z`);

      // Buscar contagem de produtos em estoque crítico (< 5)
      const { data: estoqueCritico, error: errorEstoque } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual')
        .lt('estoque_atual', 5)
        .eq('ativo', true);

      if (errorPedidos) console.error(errorPedidos);
      if (errorEstoque) console.error(errorEstoque);

      const pedidos = pedidosHoje || [];
      const pendentes = pedidos.filter(p => p.status === 'pendente' || p.status === 'preparando');
      const concluidos = pedidos.filter(p => p.status === 'entregue' || p.status === 'finalizado');
      
      const vendasHoje = concluidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);

      return {
        vendasHoje,
        pendentes: pendentes.length,
        atendidos: concluidos.length,
        estoqueCriticoCount: estoqueCritico?.length || 0,
        ultimosPedidos: pedidos.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()).slice(0, 5),
        estoqueItens: estoqueCritico || []
      };
    }
  });

  // Mock dados do gráfico (pode ser adaptado para agrupar as vendas por hora futuramente)
  const chartData = [
    { name: '10h', value: 120 },
    { name: '11h', value: 250 },
    { name: '12h', value: 400 },
    { name: '13h', value: 180 },
    { name: '14h', value: 90 },
    { name: '15h', value: 150 },
  ];

  if (loadingMetrics) {
    return (
      <div className="space-y-6">
         <h2 className="text-2xl font-extrabold">Dashboard</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Vendas Hoje</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-300">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics?.vendasHoje || 0)}
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">Soma dos pedidos finalizados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Pendentes</CardTitle>
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">{metrics?.pendentes || 0}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Aguardando preparo</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Atendidos</CardTitle>
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{metrics?.atendidos || 0}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Pedidos entregues hoje</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Estoque Crítico</CardTitle>
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-300">{metrics?.estoqueCriticoCount || 0}</div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Produtos &lt; 5 unidades</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vendas por Hora (Visão Geral)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Últimos pedidos */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Últimos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.ultimosPedidos && metrics.ultimosPedidos.length > 0 ? (
              <div className="space-y-4">
                {metrics.ultimosPedidos.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="font-bold"># {pedido.numero_pedido}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {pedido.crianca_nome && ` • ${pedido.crianca_nome}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-medium text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total || 0)}
                      </div>
                      <Badge variant={pedido.status === 'entregue' || pedido.status === 'finalizado' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                        {pedido.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhum pedido registrado hoje.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Alerta de Estoque visual se tiver crítico */}
      {metrics?.estoqueItens && metrics.estoqueItens.length > 0 && (
         <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/30">
           <CardHeader className="py-3">
             <CardTitle className="text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
               <AlertTriangle className="w-4 h-4" /> Itens Precisando de Reposição
             </CardTitle>
           </CardHeader>
           <CardContent className="py-3 pt-0">
             <div className="flex flex-wrap gap-2">
               {metrics.estoqueItens.map(item => (
                 <Badge key={item.id} variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-400">
                   {item.nome} • Restam {item.estoque_atual}
                 </Badge>
               ))}
             </div>
           </CardContent>
         </Card>
      )}
    </div>
  );
}
