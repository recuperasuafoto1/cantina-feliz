import { useState, useEffect } from 'react';
import { CardProduto } from '@/components/CardProduto';
import { DrawerCarrinho } from '@/components/DrawerCarrinho';
import { useCarrinho, CarrinhoProvider } from '@/contexts/CarrinhoContext';
import { supabase } from '@/integrations/supabase/client';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string;
  categoria: string;
  estoque_atual: number;
  ativo: boolean;
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
  const { adicionarItem, limparCarrinho } = useCarrinho();

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

  const finalizarPedido = async () => {
    const numero = Math.floor(Math.random() * 990) + 11;
    setPedidoFinalizado(numero);
    limparCarrinho();
  };

  if (pedidoFinalizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="text-center space-y-6">
          <p className="text-6xl">🎉</p>
          <h1 className="text-2xl font-extrabold text-foreground">Pedido realizado!</h1>
          <p className="text-[72px] font-black text-primary leading-none">
            #{pedidoFinalizado}
          </p>
          <p className="text-muted-foreground text-sm">
            Aguarde seu número ser chamado
          </p>
          <Button
            onClick={() => setPedidoFinalizado(null)}
            className="w-[80%] h-14 text-lg font-extrabold rounded-2xl bg-secondary text-secondary-foreground btn-press"
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
                onAdicionar={() => adicionarItem({
                  produto_id: produto.id,
                  nome: produto.nome,
                  preco: produto.preco,
                  imagem_url: produto.imagem_url,
                })}
              />
            ))}
          </div>
        )}
      </main>

      <DrawerCarrinho onFinalizar={finalizarPedido} />
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
