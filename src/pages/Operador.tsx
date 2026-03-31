// Tela do Operador - Fullscreen para funcionários gerenciarem pedidos
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast as toaster } from 'sonner';

interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  produto_id: string;
  preco_unitario: number;
}

interface PedidoOperador {
  id: string;
  numero_pedido: number;
  status: string;
  valor_total: number;
  forma_pagamento: string | null;
  crianca_id: string | null;
  crianca_nome: string | null;
  itens: ItemPedido[];
}

export default function Operador() {
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoOperador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [entregando, setEntregando] = useState(false);

  // Estado para edição de pedido
  const [editarAberto, setEditarAberto] = useState(false);
  const [itensEditados, setItensEditados] = useState<ItemPedido[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Saldo da criança para exibir no operador
  const [saldoCrianca, setSaldoCrianca] = useState<number | null>(null);

  const buscarProximoPedido = async () => {
    try {
      if (!pedido) setCarregando(true);
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status, valor_total, forma_pagamento, crianca_id, crianca_nome')
        .in('status', ['pendente', 'preparando'])
        .order('criado_em', { ascending: true })
        .limit(1);

      if (pedidos && pedidos.length > 0) {
        const p = pedidos[0];

        if (pedido?.id === p.id) {
          setCarregando(false);
          return;
        }

        const { data: itens } = await supabase
          .from('itens_pedido')
          .select('id, quantidade, produto_id, preco_unitario, produtos(nome)')
          .eq('pedido_id', p.id);

        const pedidoData: PedidoOperador = {
          id: p.id,
          numero_pedido: p.numero_pedido,
          status: p.status,
          valor_total: p.valor_total || 0,
          forma_pagamento: p.forma_pagamento,
          crianca_id: p.crianca_id,
          crianca_nome: p.crianca_nome,
          itens: (itens || []).map((i: any) => ({
            id: i.id,
            nome: i.produtos?.nome || 'Item Desconhecido',
            quantidade: i.quantidade,
            produto_id: i.produto_id,
            preco_unitario: i.preco_unitario,
          })),
        };

        setPedido(pedidoData);

        // Buscar saldo da criança se for crédito
        if (p.crianca_id) {
          const { data: crianca } = await supabase
            .from('criancas_clientes')
            .select('saldo_credito')
            .eq('id', p.crianca_id)
            .single();
          setSaldoCrianca(crianca ? Number(crianca.saldo_credito) : null);
        } else {
          setSaldoCrianca(null);
        }
      } else {
        setPedido(null);
        setSaldoCrianca(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarProximoPedido();

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

  // Entregar pedido - sem popup de pagamento, apenas marca como entregue
  const entregarPedido = async () => {
    if (!pedido || entregando) return;
    setEntregando(true);
    try {
      // Se for crédito, debitar saldo (mesmo ficando negativo)
      if (pedido.forma_pagamento === 'credito' && pedido.crianca_id) {
        // Buscar saldo atual da criança
        const { data: crianca } = await supabase
          .from('criancas_clientes')
          .select('saldo_credito')
          .eq('id', pedido.crianca_id)
          .single();

        if (crianca) {
          const novoSaldo = Number(crianca.saldo_credito) - pedido.valor_total;
          await supabase.from('criancas_clientes')
            .update({ saldo_credito: novoSaldo })
            .eq('id', pedido.crianca_id);

          await supabase.from('movimentacoes_credito').insert({
            crianca_id: pedido.crianca_id,
            valor: pedido.valor_total,
            tipo: 'saida',
            descricao: `Pagamento Pedido #${pedido.numero_pedido}`,
          } as any);
        }
      }

      // Marcar como entregue
      await supabase.from('pedidos')
        .update({
          status: 'entregue',
          finalizado_em: new Date().toISOString(),
        })
        .eq('id', pedido.id);

      toaster.success(`✅ Pedido #${pedido.numero_pedido} entregue!`);
      setPedido(null);
      buscarProximoPedido();
    } catch (e: any) {
      toaster.error(`Erro ao entregar: ${e.message}`);
    } finally {
      setEntregando(false);
    }
  };

  const cancelarPedido = async () => {
    if (!pedido || cancelando) return;
    setCancelando(true);
    try {
      // Devolver estoque
      for (const item of pedido.itens) {
        if (item.produto_id) {
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

  // ---- Edição de Pedido ----
  const abrirEdicao = async () => {
    if (!pedido) return;
    setItensEditados([...pedido.itens]);

    // Buscar produtos disponíveis para adicionar
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, preco, estoque_atual')
      .eq('ativo', true)
      .gt('estoque_atual', 0)
      .order('nome');
    setProdutosDisponiveis(data || []);
    setEditarAberto(true);
  };

  const alterarQtdEditado = (itemId: string, delta: number) => {
    setItensEditados(prev => prev.map(i =>
      i.id === itemId ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i
    ).filter(i => i.quantidade > 0));
  };

  const removerItemEditado = (itemId: string) => {
    setItensEditados(prev => prev.filter(i => i.id !== itemId));
  };

  const adicionarProdutoEditado = (produto: any) => {
    // Checar se já existe
    const existente = itensEditados.find(i => i.produto_id === produto.id);
    if (existente) {
      setItensEditados(prev => prev.map(i =>
        i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
      ));
    } else {
      setItensEditados(prev => [...prev, {
        id: `novo-${Date.now()}`,
        nome: produto.nome,
        quantidade: 1,
        produto_id: produto.id,
        preco_unitario: Number(produto.preco),
      }]);
    }
  };

  const salvarEdicao = async () => {
    if (!pedido) return;
    setSalvandoEdicao(true);
    try {
      // 1. Devolver estoque dos itens originais
      for (const item of pedido.itens) {
        const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
        if (prod) {
          await supabase.from('produtos')
            .update({ estoque_atual: prod.estoque_atual + item.quantidade })
            .eq('id', item.produto_id);
        }
      }

      // 2. Deletar itens antigos
      await supabase.from('itens_pedido').delete().eq('pedido_id', pedido.id);

      // 3. Inserir novos itens
      if (itensEditados.length > 0) {
        const novosItens = itensEditados.map(i => ({
          pedido_id: pedido.id,
          produto_id: i.produto_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          subtotal: i.preco_unitario * i.quantidade,
        }));
        await (supabase.from('itens_pedido') as any).insert(novosItens);
      }

      // 4. Decrementar estoque dos novos itens
      for (const item of itensEditados) {
        const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
        if (prod) {
          await supabase.from('produtos')
            .update({ estoque_atual: Math.max(0, prod.estoque_atual - item.quantidade) })
            .eq('id', item.produto_id);
        }
      }

      // 5. Recalcular total
      const novoTotal = itensEditados.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);
      await supabase.from('pedidos').update({ valor_total: novoTotal }).eq('id', pedido.id);

      toaster.success('Pedido editado com sucesso!');
      setEditarAberto(false);
      // Forçar refresh
      setPedido(null);
      buscarProximoPedido();
    } catch (e: any) {
      toaster.error(`Erro ao salvar edição: ${e.message}`);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Badge da forma de pagamento
  const renderBadgePagamento = () => {
    if (!pedido) return null;
    const forma = pedido.forma_pagamento;

    if (forma === 'credito') {
      const saldoNegativo = saldoCrianca !== null && (saldoCrianca - pedido.valor_total) < 0;
      return (
        <div className="text-center space-y-1">
          <Badge className="text-lg px-4 py-1 bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200">
            🧒 Crédito - {pedido.crianca_nome}
          </Badge>
          {saldoCrianca !== null && (
            <p className={`text-sm font-bold ${saldoNegativo ? 'text-destructive' : 'text-emerald-600'}`}>
              {saldoNegativo
                ? `⚠️ Saldo Negativo após débito: -R$ ${Math.abs(saldoCrianca - pedido.valor_total).toFixed(2).replace('.', ',')}`
                : `Saldo: R$ ${saldoCrianca.toFixed(2).replace('.', ',')}`
              }
            </p>
          )}
        </div>
      );
    }

    if (forma === 'pix') {
      return <Badge className="text-lg px-4 py-1 bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200">💠 Pix</Badge>;
    }

    return <Badge className="text-lg px-4 py-1 bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200">💵 Dinheiro</Badge>;
  };

  // Produtos que não estão já no pedido editado
  const produtosParaAdicionar = produtosDisponiveis.filter(
    p => !itensEditados.find(i => i.produto_id === p.id)
  );

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
          <h2 className="text-4xl font-extrabold mb-4">Acabaram os pedidos!</h2>
          <p className="text-xl text-muted-foreground">Aguarde novos clientes... 🎉</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 animate-fade-in w-full max-w-5xl mx-auto gap-6">

          {/* Número do pedido */}
          <div className="text-center slide-in-bottom">
            <p className="text-xl md:text-2xl text-muted-foreground font-bold uppercase tracking-widest mb-2">Pedido Pendente</p>
            <p className="text-[120px] md:text-[200px] font-black text-primary leading-none tabular-nums drop-shadow-sm">
              #{pedido.numero_pedido}
            </p>
          </div>

          {/* Badge de pagamento */}
          <div className="slide-in-bottom" style={{ animationDelay: '50ms' }}>
            {renderBadgePagamento()}
          </div>

          {/* Itens e total */}
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

          {/* Botões de ação */}
          <div className="w-full max-w-2xl flex flex-col gap-4 slide-in-bottom" style={{ animationDelay: '200ms' }}>
            <Button
              onClick={entregarPedido}
              disabled={entregando}
              className="h-28 md:h-32 text-3xl md:text-4xl font-extrabold rounded-3xl bg-green-500 hover:bg-green-600 text-white shadow-lg active:scale-95 transition-all w-full"
            >
              {entregando ? <Loader2 className="w-8 h-8 animate-spin mr-3" /> : null}
              🟢 PEDIDO ENTREGUE
            </Button>

            <div className="grid grid-cols-2 gap-4 h-20 md:h-24">
              <Button
                variant="outline"
                onClick={abrirEdicao}
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

      {/* Sheet de Edição de Pedido */}
      <Sheet open={editarAberto} onOpenChange={setEditarAberto}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-xl font-black">✏️ Editar Pedido #{pedido?.numero_pedido}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Itens atuais */}
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Itens do Pedido</h3>
            {itensEditados.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum item no pedido.</p>
            ) : (
              <div className="space-y-2">
                {itensEditados.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => alterarQtdEditado(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center btn-press"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQtdEditado(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removerItemEditado(item.id)} className="text-destructive p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar produtos */}
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider pt-4">Adicionar Produtos</h3>
            <div className="space-y-2">
              {produtosParaAdicionar.map(p => (
                <button
                  key={p.id}
                  onClick={() => adicionarProdutoEditado(p)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors btn-press"
                >
                  <span className="font-bold text-sm">{p.nome}</span>
                  <span className="text-sm text-muted-foreground">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rodapé edição */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Novo Total</span>
              <span className="text-2xl font-extrabold text-primary">
                R$ {itensEditados.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Button
              onClick={salvarEdicao}
              disabled={salvandoEdicao || itensEditados.length === 0}
              className="w-full h-14 text-lg font-extrabold rounded-2xl btn-press"
            >
              {salvandoEdicao ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ModalConfirmacao
        aberto={modalCancelar}
        onFechar={() => setModalCancelar(false)}
        onConfirmar={cancelarPedido}
        titulo="Confirmar Cancelamento"
        mensagem={`Você está prestes a cancelar o pedido #${pedido?.numero_pedido} e devolver os itens ao estoque.\n\nTem certeza?`}
        textoBotaoConfirmar={cancelando ? 'Cancelando...' : 'Sim, cancelar e devolver itens'}
        variante="destructive"
      />
    </div>
  );
}
