import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { getImagemProduto } from '@/lib/imagens-produtos';
import { InputQuantidade } from '@/components/InputQuantidade';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface DrawerCarrinhoProps {
  onFinalizar: () => void;
}

export function DrawerCarrinho({ onFinalizar }: DrawerCarrinhoProps) {
  const { itens, alterarQuantidade, removerItem, total, totalItens } = useCarrinho();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center btn-press hover:shadow-2xl transition-shadow min-w-[64px] min-h-[64px]">
          <ShoppingCart className="w-6 h-6" />
          {totalItens > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
              {totalItens}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-xl font-extrabold">🛒 Seu Pedido</SheetTitle>
        </SheetHeader>

        {itens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ShoppingCart className="w-12 h-12 opacity-30" />
            <p className="text-sm">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {itens.map(item => (
                <div key={item.produto_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <img src={item.imagem_url || '/placeholder.svg'} alt={item.nome} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <InputQuantidade
                    valor={item.quantidade}
                    onChange={(q) => alterarQuantidade(item.produto_id, q)}
                    tamanho="sm"
                  />
                  <button onClick={() => removerItem(item.produto_id)} className="text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-extrabold text-primary">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <Button
                onClick={onFinalizar}
                className="w-full h-14 text-lg font-extrabold rounded-2xl bg-cantina-success hover:bg-cantina-success/90 text-primary-foreground btn-press"
                size="lg"
              >
                🎉 Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
