import { useState, useEffect } from 'react';
import { CardProduto } from '@/components/CardProduto';
import { DrawerCarrinho } from '@/components/DrawerCarrinho';
import { ModalPagamento, PagamentoSelecionado } from '@/components/ModalPagamento';
import { useCarrinho, CarrinhoProvider, UpsellInfo } from '@/contexts/CarrinhoContext';
import { supabase } from '@/integrations/supabase/client';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string;
  categoria: string;
  estoque_atual: number;
  ativo: boolean;
  eh_order_bump_para: string | null;
  tem_upsell_para: string | null;
}

const CATEGORIAS = [
  { id: 'todos', nome: 'Todos', emoji: '🍽️' },
  { id: 'lanche', nome: 'Lanches', emoji: '🥪' },
  { id: 'bebida', nome: 'Bebidas', emoji: '🧃' },
  { id: 'doce', nome: 'Doces', emoji: '🍰' },
  { id: 'snack', nome: 'Snacks', emoji: '🍿' },
];

function CardapioConteudo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [pedidoFinalizado, setPedidoFinalizado] = useState<number | null>(null);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [processandoPedido, setProcessandoPedido] = useState(false);
  const { adicionarItem, limparCarrinho, itens, removerItem, total } = useCarrinho();

  useEffect(() => {
    async function buscarProdutos() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('estoque_atual', 0)
        .order('categoria') as { data: any[] | null; error: any };

      if (!error && data) {
        setProdutos(data as Produto[]);
      }
      setCarregando(false);
    }
    buscarProdutos();
  }, []);

  const produtosFiltrados = categoriaAtiva === 'todos'
    ? produtos
    : produtos.filter(p => p.categoria === categoriaAtiva);

  // Buscar info de bump para um produto
  const getBumpInfo = (produtoId: string) => {
    const bump = produtos.find(p => p.eh_order_bump_para === produtoId);
    if (!bump) return undefined;
    return {
      produto_id: bump.id,
      nome: bump.nome,
      preco: bump.preco,
      imagem_url: bump.imagem_url || '',
    };
  };

  // Calcular upsells disponíveis
  const getUpsellsDisponiveis = (): UpsellInfo[] => {
    const upsells: UpsellInfo[] = [];
    for (const item of itens) {
      if (item.eh_bump) continue;
      const produto = produtos.find(p => p.id === item.produto_id);
      if (produto?.tem_upsell_para) {
        const upsellProduto = produtos.find(p => p.id === produto.tem_upsell_para);
        if (upsellProduto) {
          upsells.push({
            item_original_id: item.produto_id,
            item_original_nome: item.nome,
            upsell: {
              produto_id: upsellProduto.id,
              nome: upsellProduto.nome,
              preco: upsellProduto.preco,
              imagem_url: upsellProduto.imagem_url || '',
            },
            diferenca: upsellProduto.preco - item.preco,
          });
        }
      }
    }
    return upsells;
  };

  const handleAceitarUpsell = (upsell: UpsellInfo) => {
    removerItem(upsell.item_original_id);
    adicionarItem({
      produto_id: upsell.upsell.produto_id,
      nome: upsell.upsell.nome,
      preco: upsell.upsell.preco,
      imagem_url: upsell.upsell.imagem_url,
    });
  };

  // Chamado pelo DrawerCarrinho ao finalizar (após upsells)
  const handlePreFinalizar = async () => {
    // Abre modal de pagamento em vez de finalizar direto
    setModalPagamento(true);
  };

  // Chamado ao confirmar forma de pagamento
  const confirmarPedido = async (pagamento: PagamentoSelecionado) => {
    setProcessandoPedido(true);
    try {
      // 1. Gerar número do pedido via RPC
      const { data: numero, error: errNum } = await supabase.rpc('gerar_numero_pedido');
      if (errNum || !numero) {
        toast.error('Erro ao gerar número do pedido');
        console.error(errNum);
        setProcessandoPedido(false);
        return;
      }

      // 2. Calcular total
      const valorTotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

      // 3. Criar pedido com forma de pagamento e crianca_id
      const pedidoData: any = {
        numero_pedido: numero,
        status: 'pendente',
        valor_total: valorTotal,
        forma_pagamento: pagamento.forma,
      };
      if (pagamento.forma === 'credito' && pagamento.crianca_id) {
        pedidoData.crianca_id = pagamento.crianca_id;
        pedidoData.crianca_nome = pagamento.crianca_nome;
      }

      const { data: pedido, error: errPedido } = await (supabase.from('pedidos') as any)
        .insert(pedidoData)
        .select('id')
        .single();

      if (errPedido || !pedido) {
        toast.error('Erro ao criar pedido');
        console.error(errPedido);
        setProcessandoPedido(false);
        return;
      }

      // 4. Criar itens do pedido
      const itensInsert = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.preco * item.quantidade,
      }));

      const { error: errItens } = await (supabase.from('itens_pedido') as any).insert(itensInsert);
      if (errItens) console.error('Erro itens:', errItens);

      // 5. Decrementar estoque
      for (const item of itens) {
        const prod = produtos.find(p => p.id === item.produto_id);
        if (prod) {
          await (supabase.from('produtos') as any)
            .update({ estoque_atual: Math.max(0, prod.estoque_atual - item.quantidade) })
            .eq('id', item.produto_id);
        }
      }

      // 6. Sucesso
      setModalPagamento(false);
      setPedidoFinalizado(numero);
      limparCarrinho();
    } catch (err) {
      console.error(err);
      toast.error('Erro inesperado ao finalizar pedido');
    } finally {
      setProcessandoPedido(false);
    }
  };

  if (pedidoFinalizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="text-center space-y-6 animate-scale-in">
          <p className="text-6xl">🎉</p>
          <h1 className="text-2xl font-extrabold text-foreground">Pedido realizado!</h1>
          <p className="text-6xl md:text-8xl font-black text-primary leading-none">
            #{pedidoFinalizado}
          </p>
          <p className="text-muted-foreground text-sm">
            Anote seu número e apresente no caixa!
          </p>
          <Button
            onClick={() => setPedidoFinalizado(null)}
            className="w-full max-w-md h-20 text-2xl font-extrabold rounded-2xl bg-secondary text-secondary-foreground btn-press"
          >
            🔄 Novo Pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <UtensilsCrossed className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-extrabold text-foreground">Cantina Marum</h1>
        </div>
      </header>

      <div className="sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm px-4 py-2">
        <div className="flex gap-2 overflow-x-auto max-w-lg mx-auto scrollbar-hide">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all btn-press min-h-[44px] ${
                categoriaAtiva === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.emoji} {cat.nome}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-2">😅</p>
            <p className="font-bold">Nenhum produto disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtosFiltrados.map((produto, i) => (
              <CardProduto
                key={produto.id}
                id={produto.id}
                nome={produto.nome}
                descricao={produto.descricao}
                preco={produto.preco}
                imagem_url={produto.imagem_url}
                indice={i}
                onAdicionar={() => adicionarItem(
                  {
                    produto_id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    imagem_url: produto.imagem_url,
                  },
                  getBumpInfo(produto.id),
                )}
              />
            ))}
          </div>
        )}
      </main>

      <DrawerCarrinho
        onFinalizar={handlePreFinalizar}
        upsells={getUpsellsDisponiveis()}
        onAceitarUpsell={handleAceitarUpsell}
      />

      {/* Modal de pagamento - abre ANTES de gerar número */}
      <ModalPagamento
        aberto={modalPagamento}
        onFechar={() => setModalPagamento(false)}
        onConfirmar={confirmarPedido}
        valorTotal={total}
        processando={processandoPedido}
      />
    </div>
  );
}

export default function Cardapio() {
  return (
    <CarrinhoProvider>
      <CardapioConteudo />
    </CarrinhoProvider>
  );
}
