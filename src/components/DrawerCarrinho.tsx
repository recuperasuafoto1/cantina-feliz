import { useState } from 'react';
import { ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { useCarrinho, UpsellInfo } from '@/contexts/CarrinhoContext';
import { getImagemProduto } from '@/lib/imagens-produtos';
import { InputQuantidade } from '@/components/InputQuantidade';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface DrawerCarrinhoProps {
  onFinalizar: () => Promise<void>;
  upsells: UpsellInfo[];
  onAceitarUpsell: (upsell: UpsellInfo) => void;
}

export function DrawerCarrinho({ onFinalizar, upsells, onAceitarUpsell }: DrawerCarrinhoProps) {
  const { itens, alterarQuantidade, removerItem, total, totalItens, bumpsDisponiveis, bumpsAtivos, toggleBump } = useCarrinho();
  const [finalizando, setFinalizando] = useState(false);
  const [upsellAtual, setUpsellAtual] = useState<UpsellInfo | null>(null);
  const [upsellIndex, setUpsellIndex] = useState(0);
  const [sheetAberto, setSheetAberto] = useState(false);

  // Fluxo: clicou Finalizar → checar upsells → mostrar um a um → finalizar
  const handleFinalizar = () => {
    if (itens.length === 0) return;
    if (upsells.length > 0) {
      setUpsellIndex(0);
      setUpsellAtual(upsells[0]);
    } else {
      executarFinalizacao();
    }
  };

  const executarFinalizacao = async () => {
    setFinalizando(true);
    await onFinalizar();
    setFinalizando(false);
    setSheetAberto(false);
  };

  const handleUpsellAceitar = () => {
    if (upsellAtual) onAceitarUpsell(upsellAtual);
    avancarUpsell();
  };

  const handleUpsellRecusar = () => {
    avancarUpsell();
  };

  const avancarUpsell = () => {
    const next = upsellIndex + 1;
    if (next < upsells.length) {
      setUpsellIndex(next);
      setUpsellAtual(upsells[next]);
    } else {
      setUpsellAtual(null);
      executarFinalizacao();
    }
  };

  // Itens normais (não bump)
  const itensNormais = itens.filter(i => !i.eh_bump);

  return (
    <>
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
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
              <div className="flex-1 overflow-y-auto space-y-2 py-4">
                {itensNormais.map(item => (
                  <div key={item.produto_id}>
                    {/* Item principal */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <img src={getImagemProduto(item.nome, item.imagem_url)} alt={item.nome} className="w-10 h-10 rounded-lg object-cover" />
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

                    {/* Order Bump sugestão */}
                    {bumpsDisponiveis.has(item.produto_id) && (
                      <div className="ml-4 mt-1 p-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 flex items-center gap-2">
                        <Switch
                          checked={bumpsAtivos.has(item.produto_id)}
                          onCheckedChange={() => toggleBump(item.produto_id)}
                        />
                        <p className="text-xs flex-1">
                          Que tal adicionar{' '}
                          <span className="font-bold">{bumpsDisponiveis.get(item.produto_id)!.nome}</span>
                          {' '}por apenas{' '}
                          <span className="font-bold text-primary">
                            R$ {bumpsDisponiveis.get(item.produto_id)!.preco.toFixed(2).replace('.', ',')}
                          </span>?
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Itens bump ativados (mostrar como referência visual) */}
                {itens.filter(i => i.eh_bump).map(item => (
                  <div key={`bump-${item.produto_id}-${item.bump_de}`} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 ml-4">
                    <img src={getImagemProduto(item.nome, item.imagem_url)} alt={item.nome} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">🎁 {item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {item.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
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
                  onClick={handleFinalizar}
                  disabled={finalizando}
                  className="w-full h-14 text-lg font-extrabold rounded-2xl bg-cantina-success hover:bg-cantina-success/90 text-primary-foreground btn-press"
                  size="lg"
                >
                  {finalizando ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processando...</>
                  ) : (
                    '🎉 Finalizar Pedido'
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal Upsell */}
      <Dialog open={!!upsellAtual} onOpenChange={(open) => { if (!open) handleUpsellRecusar(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">🚀 E se você levasse o combo especial?</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Troque <span className="font-bold">{upsellAtual?.item_original_nome}</span> por{' '}
              <span className="font-bold text-primary">{upsellAtual?.upsell.nome}</span> por apenas{' '}
              <span className="font-bold text-primary">
                R$ {upsellAtual?.diferenca.toFixed(2).replace('.', ',')}
              </span> a mais!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleUpsellAceitar}
              className="w-full h-12 text-base font-extrabold rounded-xl bg-primary btn-press"
            >
              ✅ Sim, quero upgrade!
            </Button>
            <Button
              onClick={handleUpsellRecusar}
              variant="outline"
              className="w-full h-10 text-sm font-bold rounded-xl btn-press"
            >
              Não, obrigado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
