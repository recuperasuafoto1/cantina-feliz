import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, Loader2, DollarSign, Wallet } from 'lucide-react';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { toast as toaster } from 'sonner';
import { Input } from '@/components/ui/input';

interface PedidoOperador {
  id: string;
  numero_pedido: number;
  status: string;
  valor_total: number;
  itens: { id: string, nome: string; quantidade: number, produto_id: string }[];
}

export default function Operador() {
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoOperador | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  const [modalCancelar, setModalCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  
  const [modalPagamento, setModalPagamento] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [buscaCrianca, setBuscaCrianca] = useState('');
  const [criancasFiltradas, setCriancasFiltradas] = useState<any[]>([]);

  const buscarProximoPedido = async () => {
    try {
      if(!pedido) setCarregando(true);
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status, valor_total')
        .in('status', ['pendente', 'preparando'])
        .order('criado_em', { ascending: true })
        .limit(1);

      if (pedidos && pedidos.length > 0) {
        const p = pedidos[0];
        
        // Evita piscar se já for o mesmo pedido
        if (pedido?.id === p.id) {
           setCarregando(false);
           return;
        }

        const { data: itens } = await supabase
          .from('itens_pedido')
          .select('id, quantidade, produto_id, produtos(nome)')
          .eq('pedido_id', p.id);

        setPedido({
          id: p.id,
          numero_pedido: p.numero_pedido,
          status: p.status,
          valor_total: p.valor_total || 0,
          itens: (itens || []).map((i: any) => ({
            id: i.id,
            nome: i.produtos?.nome || 'Item Desconhecido',
            quantidade: i.quantidade,
            produto_id: i.produto_id
          })),
        });
      } else {
        setPedido(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarProximoPedido();

    // Inscricao em real-time e Polling de salva-guarda
    const channel = supabase.channel('pedidos-operador')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
         toaster.success(`🔔 Novo pedido #${payload.new.numero_pedido} chegou!`);
         buscarProximoPedido();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
         buscarProximoPedido();
      })
      .subscribe();

    const intervalId = setInterval(buscarProximoPedido, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const processarPagamentoFinal = async (formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão' | 'Crédito', criancaOp?: any) => {
    if (!pedido || finalizando) return;
    setFinalizando(true);
    try {
       // Se for credito, debitar saldo
       if (formaPagamento === 'Crédito' && criancaOp) {
          if (criancaOp.saldo_credito < pedido.valor_total) {
              toaster.error("Saldo insuficiente!");
              setFinalizando(false);
              return;
          }
          // Transação manual: Deduz saldo, insere movimento, atualiza pedido
          await supabase.from('criancas_clientes')
            .update({ saldo_credito: criancaOp.saldo_credito - pedido.valor_total })
            .eq('id', criancaOp.id);
            
          await supabase.from('movimentacoes_credito').insert({
             crianca_id: criancaOp.id,
             valor: pedido.valor_total,
             tipo: 'saida',
             descricao: `Pagamento Pedido #${pedido.numero_pedido}`
          });
       }

       // Atualiza o pedido
       await supabase.from('pedidos')
         .update({ 
            status: 'entregue', 
            forma_pagamento: formaPagamento, 
            finalizado_em: new Date().toISOString() 
         })
         .eq('id', pedido.id);
         
       toaster.success(`✅ Pedido #${pedido.numero_pedido} entregue! (${formaPagamento})`);
       setModalPagamento(false);
       setPedido(null); // Limpa para mostrar loader ou mensagem vazio
       buscarProximoPedido();
    } catch (e: any) {
       toaster.error(`Erro ao finalizar: ${e.message}`);
    } finally {
       setFinalizando(false);
    }
  };

  const cancelarPedido = async () => {
    if (!pedido || cancelando) return;
    setCancelando(true);
    try {
      // Devolver quantidades ao estoque
      for (const item of pedido.itens) {
        if (item.produto_id) {
           // RPC ou read/update - por simplicidade aqui read -> update
           const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
           if (prod) {
             await supabase.from('produtos')
               .update({ estoque_atual: prod.estoque_atual + item.quantidade })
               .eq('id', item.produto_id);
           }
        }
      }

      await supabase.from('pedidos')
        .update({ status: 'cancelado', finalizado_em: new Date().toISOString() })
        .eq('id', pedido.id);
        
      toaster.info(`Pedido #${pedido.numero_pedido} cancelado e estoque revertido.`);
      setModalCancelar(false);
      setPedido(null);
      buscarProximoPedido();
    } catch (e: any) {
      toaster.error(`Erro ao cancelar: ${e.message}`);
    } finally {
      setCancelando(false);
    }
  };

  const buscarCriancasCredito = async (busca: string) => {
     setBuscaCrianca(busca);
     if(busca.length < 2) {
       setCriancasFiltradas([]);
       return;
     }
     const { data } = await supabase
       .from('criancas_clientes')
       .select('*')
       .ilike('nome', `%${busca}%`)
       .eq('ativo', true)
       .limit(5);
     setCriancasFiltradas(data || []);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative text-foreground">
      <button
        onClick={() => navigate('/pain3l')}
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center btn-press hover:bg-muted"
      >
        <X className="w-6 h-6 text-muted-foreground" />
      </button>

      {carregando && !pedido ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      ) : !pedido ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-pulse" style={{ animationDuration: '3s' }}>
          <Package className="w-32 h-32 text-muted-foreground/20 mb-6" />
          <h2 className="text-4xl font-extrabold mb-4">
            Acabaram os pedidos!
          </h2>
          <p className="text-xl text-muted-foreground">
            Aguarde novos clientes... 🎉
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 animate-fade-in w-full max-w-5xl mx-auto gap-8">
          
          <div className="text-center slide-in-bottom">
            <p className="text-xl md:text-2xl text-muted-foreground font-bold uppercase tracking-widest mb-2">Pedido Pendente</p>
            <p className="text-[120px] md:text-[200px] font-black text-primary leading-none tabular-nums drop-shadow-sm">
              #{pedido.numero_pedido}
            </p>
          </div>

          <div className="w-full max-w-2xl bg-card rounded-3xl p-6 md:p-10 border shadow-xl slide-in-bottom" style={{ animationDelay: '100ms' }}>
            <div className="space-y-4 mb-8">
              {pedido.itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-2xl md:text-3xl font-extrabold text-card-foreground border-b pb-4 last:border-0 last:pb-0">
                  <span className="flex-1">
                    <span className="text-primary mr-3">{item.quantidade}x</span> 
                    {item.nome}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-6 border-t-4 border-muted border-dashed">
               <span className="text-2xl font-bold text-muted-foreground">TOTAL:</span>
               <span className="text-4xl md:text-5xl font-black text-foreground">
                 R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
               </span>
            </div>
          </div>

          <div className="w-full max-w-2xl flex flex-col gap-4 slide-in-bottom" style={{ animationDelay: '200ms' }}>
            <Button
              onClick={() => setModalPagamento(true)}
              className="h-28 md:h-32 text-3xl md:text-4xl font-extrabold rounded-3xl bg-green-500 hover:bg-green-600 text-white shadow-lg active:scale-95 transition-all w-full"
            >
              🟢 PEDIDO ENTREGUE
            </Button>
            
            <div className="grid grid-cols-2 gap-4 h-20 md:h-24">
              <Button
                variant="outline"
                onClick={() => toaster.info("Edição virá em próxima atualização.")}
                className="h-full text-xl md:text-2xl font-bold rounded-2xl border-yellow-400 text-yellow-500 hover:bg-yellow-400 hover:text-white bg-card active:scale-95 transition-all"
              >
                🟡 EDITAR
              </Button>
              <Button
                onClick={() => setModalCancelar(true)}
                variant="destructive"
                className="h-full text-xl md:text-2xl font-bold rounded-2xl active:scale-95 transition-all opacity-90 hover:opacity-100 shadow-sm"
              >
                🔴 CANCELAR
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="max-w-2xl text-center p-8 sm:rounded-3xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black text-center">Como foi pago?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
             <Button 
               disabled={finalizando}
               onClick={() => processarPagamentoFinal('Dinheiro')}
               className="h-32 text-2xl font-bold rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-2 border-emerald-300 btn-press"
             >
               💵 Dinheiro
             </Button>
             <Button 
               disabled={finalizando}
               onClick={() => processarPagamentoFinal('Pix')}
               className="h-32 text-2xl font-bold rounded-2xl bg-teal-100 hover:bg-teal-200 text-teal-800 border-2 border-teal-300 btn-press"
             >
               💠 Pix
             </Button>
             <Button 
               disabled={finalizando}
               onClick={() => processarPagamentoFinal('Cartão')}
               className="h-32 text-2xl font-bold rounded-2xl bg-blue-100 hover:bg-blue-200 text-blue-800 border-2 border-blue-300 btn-press"
             >
               💳 Cartão
             </Button>
             
             {/* Crédito Flow */}
             <div className="col-span-1 row-span-2 flex flex-col bg-purple-50 rounded-2xl border-2 border-purple-200 overflow-hidden">
                <div className="p-4 bg-purple-100 font-bold text-purple-800 text-lg border-b border-purple-200">
                  🧒 Usar Crédito do Aluno
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <Input 
                     placeholder="Nome da criança..." 
                     value={buscaCrianca}
                     onChange={e => buscarCriancasCredito(e.target.value)}
                     className="text-lg text-center font-bold"
                  />
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-32">
                     {criancasFiltradas.map(c => (
                        <Button 
                           key={c.id} 
                           disabled={finalizando || c.saldo_credito < pedido?.valor_total!}
                           variant="outline"
                           className="w-full justify-between border-purple-200 hover:bg-purple-100 whitespace-normal h-auto py-3 text-left"
                           onClick={() => processarPagamentoFinal('Crédito', c)}
                        >
                           <span className="font-bold truncate pr-2">{c.nome}</span>
                           <span className={`font-mono text-sm shrink-0 ${c.saldo_credito < pedido?.valor_total! ? 'text-red-500 line-through' : 'text-green-600'}`}>
                              R$ {c.saldo_credito.toFixed(2)}
                           </span>
                        </Button>
                     ))}
                     {buscaCrianca.length > 1 && criancasFiltradas.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-4">Nenhuma criança encontrada.</p>
                     )}
                  </div>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModalConfirmacao
        aberto={modalCancelar}
        onFechar={() => setModalCancelar(false)}
        onConfirmar={cancelarPedido}
        titulo="Confirmar Cancelamento"
        mensagem={`Você está prestes a cancelar o pedido #${pedido?.numero_pedido} e devolver os itens ao estoque.\n\nTem certeza?`}
        textoBotaoConfirmar={cancelando ? "Cancelando..." : "Sim, cancelar e devolver itens"}
        variante="destructive"
      />
    </div>
  );
}
