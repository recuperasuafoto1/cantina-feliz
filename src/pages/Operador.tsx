import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, Loader2 } from 'lucide-react';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PedidoOperador {
  id: string;
  numero_pedido: number;
  status: string;
  itens: { nome: string; quantidade: number }[];
}

export default function Operador() {
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoOperador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalCancelar, setModalCancelar] = useState(false);

  const buscarProximoPedido = async () => {
    setCarregando(true);
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, status')
      .in('status', ['pendente', 'em_preparacao'])
      .order('criado_em', { ascending: true })
      .limit(1) as { data: any[] | null };

    if (pedidos && pedidos.length > 0) {
      const p = pedidos[0];
      const { data: itens } = await supabase
        .from('itens_pedido')
        .select('quantidade, produtos(nome)')
        .eq('pedido_id', p.id) as { data: any[] | null };

      setPedido({
        id: p.id,
        numero_pedido: p.numero_pedido,
        status: p.status,
        itens: (itens || []).map((i: any) => ({
          nome: i.produtos?.nome || 'Item',
          quantidade: i.quantidade,
        })),
      });
    } else {
      setPedido(null);
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscarProximoPedido();
    const interval = setInterval(buscarProximoPedido, 3000);
    return () => clearInterval(interval);
  }, []);

  const marcarEntregue = async () => {
    if (!pedido) return;
    await (supabase.from('pedidos') as any)
      .update({ status: 'entregue', finalizado_em: new Date().toISOString() })
      .eq('id', pedido.id);
    buscarProximoPedido();
  };

  const cancelarPedido = async () => {
    if (!pedido) return;
    await (supabase.from('pedidos') as any)
      .update({ status: 'cancelado', finalizado_em: new Date().toISOString() })
      .eq('id', pedido.id);
    buscarProximoPedido();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <button
        onClick={() => navigate('/pain3l')}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-muted flex items-center justify-center btn-press"
      >
        <X className="w-5 h-5" />
      </button>

      {carregando ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : !pedido ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-breathe">
          <Package className="w-24 h-24 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            Acabaram os pedidos!
          </h2>
          <p className="text-muted-foreground">
            Aguarde novos clientes... 🎉
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Pedido</p>
            <p className="text-[120px] font-black text-primary leading-none">
              #{pedido.numero_pedido}
            </p>
          </div>

          <div className="w-full max-w-md space-y-2 bg-card rounded-2xl p-4 border">
            {pedido.itens.map((item, i) => (
              <p key={i} className="text-xl font-bold text-card-foreground">
                {item.quantidade}x {item.nome}
              </p>
            ))}
          </div>

          <div className="w-full max-w-md flex flex-col gap-3">
            <Button
              onClick={marcarEntregue}
              className="h-32 text-2xl font-extrabold rounded-2xl bg-cantina-success hover:bg-cantina-success/90 text-primary-foreground btn-press"
            >
              🟢 PEDIDO ENTREGUE
            </Button>
            <Button
              variant="outline"
              className="h-16 text-lg font-bold rounded-2xl border-cantina-warning text-cantina-warning btn-press"
            >
              🟡 EDITAR PEDIDO
            </Button>
            <Button
              onClick={() => setModalCancelar(true)}
              variant="destructive"
              className="h-12 text-base font-bold rounded-2xl btn-press"
            >
              🔴 CANCELAR PEDIDO
            </Button>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={modalCancelar}
        onFechar={() => setModalCancelar(false)}
        onConfirmar={cancelarPedido}
        titulo="Cancelar Pedido"
        mensagem={`Tem certeza que deseja cancelar o pedido #${pedido?.numero_pedido}?`}
        textoBotaoConfirmar="Sim, cancelar"
        variante="destructive"
      />
    </div>
  );
}
