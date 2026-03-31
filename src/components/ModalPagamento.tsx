// Modal de seleção de forma de pagamento (usado na página do cliente)
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, QrCode, UserCircle, Loader2, AlertTriangle } from 'lucide-react';

export interface PagamentoSelecionado {
  forma: 'dinheiro' | 'pix' | 'credito';
  crianca_id?: string;
  crianca_nome?: string;
  saldo_atual?: number;
}

interface ModalPagamentoProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (pagamento: PagamentoSelecionado) => void;
  valorTotal: number;
  processando: boolean;
}

export function ModalPagamento({ aberto, onFechar, onConfirmar, valorTotal, processando }: ModalPagamentoProps) {
  const [etapa, setEtapa] = useState<'selecao' | 'credito'>('selecao');
  const [buscaCrianca, setBuscaCrianca] = useState('');
  const [criancasFiltradas, setCriancasFiltradas] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [criancaSelecionada, setCriancaSelecionada] = useState<any>(null);

  const resetar = () => {
    setEtapa('selecao');
    setBuscaCrianca('');
    setCriancasFiltradas([]);
    setCriancaSelecionada(null);
  };

  const handleFechar = () => {
    resetar();
    onFechar();
  };

  const buscarCriancas = async (busca: string) => {
    setBuscaCrianca(busca);
    if (busca.length < 2) {
      setCriancasFiltradas([]);
      return;
    }
    setBuscando(true);
    const { data } = await supabase
      .from('criancas_clientes')
      .select('*')
      .ilike('nome', `%${busca}%`)
      .eq('ativo', true)
      .limit(5);
    setCriancasFiltradas(data || []);
    setBuscando(false);
  };

  const confirmarCredito = () => {
    if (!criancaSelecionada) return;
    onConfirmar({
      forma: 'credito',
      crianca_id: criancaSelecionada.id,
      crianca_nome: criancaSelecionada.nome,
      saldo_atual: criancaSelecionada.saldo_credito,
    });
    resetar();
  };

  const saldoInsuficiente = criancaSelecionada && Number(criancaSelecionada.saldo_credito) < valorTotal;

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) handleFechar(); }}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">
            {etapa === 'selecao' ? '💰 Como vai pagar?' : '🧒 Pagar com Crédito'}
          </DialogTitle>
        </DialogHeader>

        {etapa === 'selecao' && (
          <div className="space-y-3 pt-2">
            <p className="text-center text-muted-foreground text-sm">
              Total: <span className="font-black text-foreground text-lg">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
            </p>

            <Button
              disabled={processando}
              onClick={() => { onConfirmar({ forma: 'dinheiro' }); resetar(); }}
              className="w-full h-20 text-xl font-bold rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-2 border-emerald-300 btn-press"
            >
              <Banknote className="w-7 h-7 mr-3" /> Dinheiro
            </Button>

            <Button
              disabled={processando}
              onClick={() => { onConfirmar({ forma: 'pix' }); resetar(); }}
              className="w-full h-20 text-xl font-bold rounded-2xl bg-teal-100 hover:bg-teal-200 text-teal-800 border-2 border-teal-300 btn-press"
            >
              <QrCode className="w-7 h-7 mr-3" /> Pix
            </Button>

            {/* Cartão desativado - ativar futuramente via configuração
            <Button disabled className="w-full h-20 text-xl font-bold rounded-2xl opacity-50">
              💳 Cartão
            </Button>
            */}

            <Button
              disabled={processando}
              onClick={() => setEtapa('credito')}
              className="w-full h-20 text-xl font-bold rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-800 border-2 border-purple-300 btn-press"
            >
              <UserCircle className="w-7 h-7 mr-3" /> Tenho Crédito
            </Button>
          </div>
        )}

        {etapa === 'credito' && (
          <div className="space-y-4 pt-2">
            <p className="text-center text-muted-foreground text-sm">
              Total: <span className="font-black text-foreground text-lg">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
            </p>

            <div className="space-y-2">
              <label className="text-sm font-bold">Digite seu nome:</label>
              <Input
                placeholder="Ex: Maria, João..."
                value={buscaCrianca}
                onChange={e => buscarCriancas(e.target.value)}
                className="h-14 text-lg font-bold text-center"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {buscando && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {!buscando && criancasFiltradas.map(c => (
                <Button
                  key={c.id}
                  variant={criancaSelecionada?.id === c.id ? 'default' : 'outline'}
                  className="w-full justify-between h-auto py-3 text-left"
                  onClick={() => setCriancaSelecionada(c)}
                >
                  <span className="font-bold truncate pr-2">{c.nome}</span>
                  <span className={`font-mono text-sm shrink-0 ${Number(c.saldo_credito) < valorTotal ? 'text-destructive' : 'text-emerald-600'}`}>
                    R$ {Number(c.saldo_credito).toFixed(2).replace('.', ',')}
                  </span>
                </Button>
              ))}
              {!buscando && buscaCrianca.length > 1 && criancasFiltradas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhum cadastro encontrado.</p>
              )}
            </div>

            {criancaSelecionada && (
              <div className={`rounded-xl p-4 border-2 ${saldoInsuficiente ? 'border-amber-400 bg-amber-50/50' : 'border-emerald-300 bg-emerald-50/50'}`}>
                <p className="font-bold text-sm mb-1">{criancaSelecionada.nome}</p>
                {saldoInsuficiente ? (
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Saldo insuficiente (R$ {Number(criancaSelecionada.saldo_credito).toFixed(2).replace('.', ',')}).
                      Seu saldo ficará negativo: <span className="font-black text-destructive">
                        -R$ {(valorTotal - Number(criancaSelecionada.saldo_credito)).toFixed(2).replace('.', ',')}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="text-emerald-700 text-sm">
                    Saldo disponível: <span className="font-black">R$ {Number(criancaSelecionada.saldo_credito).toFixed(2).replace('.', ',')}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEtapa('selecao'); setCriancaSelecionada(null); setBuscaCrianca(''); setCriancasFiltradas([]); }} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={confirmarCredito}
                disabled={!criancaSelecionada || processando}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold btn-press"
              >
                {processando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmar Crédito
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
