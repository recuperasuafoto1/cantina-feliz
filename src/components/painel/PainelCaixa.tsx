import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, DoorOpen, DoorClosed, Coins, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PainelCaixa() {
  const { funcionarioAtual } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [modalFechar, setModalFechar] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [valorFinalFechamento, setValorFinalFechamento] = useState('');

  // Busca se existe caixa "aberto" (pode ser global ou amarrado ao funcionario, farei global do dia para simplificar cantina)
  const { data: caixaAtual, isLoading: carregandoCaixa } = useQuery({
    queryKey: ['caixa-atual'],
    queryFn: async () => {
      const { data } = await supabase
        .from('caixa')
        .select('*, funcionarios(nome)')
        .eq('status', 'aberto')
        .order('data_abertura', { ascending: false })
        .limit(1)
        .single();
      return data || null;
    }
  });

  // Busca total de vendas (formas de pagamento em dinheiro podem ser filtradas, mas pediram geral)
  const { data: vendasHoje } = useQuery({
    queryKey: ['vendas-caixa', caixaAtual?.id],
    queryFn: async () => {
      if (!caixaAtual) return 0;
      
      const { data } = await supabase
        .from('pedidos')
        .select('valor_total')
        .in('status', ['entregue', 'finalizado'])
        .gte('finalizado_em', caixaAtual.data_abertura);
        
      const soma = data?.reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
      return soma;
    },
    enabled: !!caixaAtual
  });

  const abrirCaixaMut = useMutation({
    mutationFn: async (valor: number) => {
      // Pega id do funcionario
      const { data: func } = await supabase.from('funcionarios').select('id').eq('nome', funcionarioAtual).single();
      if(!func) throw new Error("Funcionário não encontrado no banco");

      const { error } = await supabase.from('caixa').insert({
        valor_inicial: valor,
        funcionario_id: func.id,
        status: 'aberto'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Caixa aberto com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
    }
  });

  const fecharCaixaMut = useMutation({
    mutationFn: async (valorFinalCalculado: number) => {
      if (!caixaAtual) return;
      const { error } = await supabase.from('caixa').update({
        status: 'fechado',
        valor_final: valorFinalCalculado,
        data_fechamento: new Date().toISOString()
      }).eq('id', caixaAtual.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Caixa fechado com sucesso!' });
      setModalFechar(false);
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
    }
  });

  const handleAbrir = () => {
    const val = parseFloat(valorInicial.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    abrirCaixaMut.mutate(val);
  };

  const handleFechar = () => {
    const val = parseFloat(valorFinalFechamento.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    fecharCaixaMut.mutate(val);
  };

  if (carregandoCaixa) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando operações de caixa...</div>;
  }

  if (!caixaAtual) {
    return (
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto mt-10">
        <div className="text-center space-y-2">
          <DoorClosed className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <h2 className="text-3xl font-extrabold">Caixa Fechado</h2>
          <p className="text-muted-foreground">O caixa do dia ainda não foi aberto. Insira o fundo de troco para iniciar.</p>
        </div>
        
        <Card className="shadow-lg border-2">
          <CardContent className="pt-6 space-y-4">
             <div className="space-y-2">
               <label className="text-sm font-bold flex items-center gap-2"><Coins className="w-4 h-4"/> Valor Inicial (Fundo de Troco)</label>
               <Input 
                 type="number" 
                 step="0.01" 
                 placeholder="Ex: 50.00" 
                 value={valorInicial}
                 onChange={e => setValorInicial(e.target.value)}
                 className="h-14 text-2xl font-bold bg-muted/50"
               />
             </div>
             <Button onClick={handleAbrir} disabled={abrirCaixaMut.isPending} className="w-full h-14 text-lg font-bold btn-press shadow-md">
                <DoorOpen className="w-5 h-5 mr-2" />
                ABRIR CAIXA AGORA
             </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saldoEsperado = (caixaAtual.valor_inicial) + (vendasHoje || 0);

  return (
    <div className="space-y-6 animate-fade-up pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" /> Controle de Caixa
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Aberto em {new Date(caixaAtual.data_abertura).toLocaleString('pt-BR')} por <span className="font-bold text-foreground">{caixaAtual.funcionarios?.nome || 'Operador'}</span></p>
        </div>
        <Button onClick={() => setModalFechar(true)} variant="destructive" className="shadow-md btn-press">
          <DoorClosed className="w-4 h-4 mr-2" /> Fechar Caixa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <span className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2"><Coins className="w-4 h-4" /> FUNDO INICIAL</span>
            <span className="text-4xl font-black">R$ {caixaAtual.valor_inicial.toFixed(2).replace('.',',')}</span>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-6">
            <span className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2"><ArrowUpCircle className="w-4 h-4" /> VENDAS DO TURNO</span>
            <span className="text-4xl font-black text-green-800 dark:text-green-300">R$ {vendasHoje?.toFixed(2).replace('.',',') || '0,00'}</span>
          </CardContent>
        </Card>

        <Card className="border-4 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <span className="text-sm font-bold text-primary flex items-center gap-2 mb-2"><Wallet className="w-4 h-4" /> SALDO ESPERADO EM CAIXA</span>
            <span className="text-5xl font-black text-primary">R$ {saldoEsperado.toFixed(2).replace('.',',')}</span>
          </CardContent>
        </Card>
      </div>

      {/* MODAL FECHAR CAIXA */}
      <Dialog open={modalFechar} onOpenChange={setModalFechar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-destructive">Encerrar Caixa do Dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-xl space-y-2">
               <div className="flex justify-between font-medium"><span>Fundo Inicial:</span> <span>R$ {caixaAtual.valor_inicial.toFixed(2)}</span></div>
               <div className="flex justify-between font-medium text-green-600"><span>Entradas (Vendas):</span> <span>+ R$ {vendasHoje?.toFixed(2) || '0.00'}</span></div>
               <div className="flex justify-between font-black text-lg border-t pt-2 mt-2"><span>Saldo Esperado:</span> <span>R$ {saldoEsperado.toFixed(2)}</span></div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="font-bold">Valor Contado em Gaveta (R$)</label>
              <Input 
                 type="number"
                 step="0.01"
                 autoFocus
                 className="h-14 text-2xl font-bold bg-background border-2 focus-visible:border-destructive"
                 placeholder="0.00"
                 value={valorFinalFechamento}
                 onChange={e => setValorFinalFechamento(e.target.value)}
              />
              <p className="text-sm text-muted-foreground flex gap-1">
                 {valorFinalFechamento && (() => {
                    const lido = parseFloat(valorFinalFechamento.replace(',','.'));
                    if (isNaN(lido)) return null;
                    const diff = lido - saldoEsperado;
                    if (diff === 0) return <span className="text-green-600 font-bold">Caixa bateu perfeitamente! ✅</span>;
                    if (diff > 0) return <span className="text-blue-500 font-bold">Sobrando R$ {Math.abs(diff).toFixed(2)}</span>;
                    return <span className="text-red-500 font-bold">Faltando R$ {Math.abs(diff).toFixed(2)} no caixa ❌</span>;
                 })()}
              </p>
            </div>
            
            <Button onClick={handleFechar} disabled={fecharCaixaMut.isPending} variant="destructive" className="w-full h-14 text-lg font-bold btn-press">
               CONFIRMAR FECHAMENTO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
