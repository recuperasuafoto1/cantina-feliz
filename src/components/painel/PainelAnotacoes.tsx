import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, StickyNote, Trash2, Save, FileText } from 'lucide-react';

export function PainelAnotacoes() {
  const { funcionarioAtual } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [conteudoLocal, setConteudoLocal] = useState('');

  // Busca se já tem anotação nesse dia
  const { data: anotacaoDia, isLoading } = useQuery({
    queryKey: ['anotacoes', dataSelecionada],
    queryFn: async () => {
      const { data } = await supabase
        .from('anotacoes_dia')
        .select('*')
        .eq('data', dataSelecionada)
        .maybeSingle();

      if (data) setConteudoLocal(data.conteudo);
      else setConteudoLocal('');

      return data || null;
    }
  });

  const salvarAnotacao = useMutation({
    mutationFn: async () => {
      // pega id funcionario
      const { data: func } = await supabase.from('funcionarios').select('id').eq('nome', funcionarioAtual).single();

      if (anotacaoDia?.id) {
        if (!conteudoLocal.trim()) {
           await supabase.from('anotacoes_dia').delete().eq('id', anotacaoDia.id);
           return;
        }
        await supabase.from('anotacoes_dia').update({ conteudo: conteudoLocal }).eq('id', anotacaoDia.id);
      } else {
        if (!conteudoLocal.trim()) return; // nada a salvar
        await supabase.from('anotacoes_dia').insert({
           data: dataSelecionada,
           conteudo: conteudoLocal,
           funcionario_id: func?.id
        });
      }
    },
    onSuccess: () => {
       toast({ title: 'Anotações salvas com sucesso!' });
       queryClient.invalidateQueries({ queryKey: ['anotacoes', dataSelecionada] });
    }
  });

  const limparAnotacao = () => {
     setConteudoLocal('');
     if (anotacaoDia) {
         salvarAnotacao.mutate(); // salva vazio = deleta
     }
  };

  const hasMudanca = (anotacaoDia?.conteudo || '') !== conteudoLocal;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <StickyNote className="w-8 h-8 text-primary" /> Diário e Anotações
        </h2>
        <p className="text-muted-foreground mt-1">Registre ocorrências, fornecedores e recados do dia.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Painel Esquerdo: Datas */}
        <Card className="w-full md:w-80 h-fit border-border shadow-sm shrink-0">
           <CardHeader className="bg-muted/50 border-b p-4">
             <CardTitle className="text-base flex items-center gap-2">
               <CalendarIcon className="w-4 h-4" /> Selecione o Dia
             </CardTitle>
           </CardHeader>
           <CardContent className="p-4">
             <input 
               type="date"
               value={dataSelecionada}
               onChange={(e) => setDataSelecionada(e.target.value)}
               className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm font-bold w-full"
             />
             
             <div className="mt-6 flex flex-col gap-3">
               <p className="text-sm font-bold text-muted-foreground mb-2">Atalhos:</p>
               <Button variant="outline" className="justify-start w-full" onClick={() => {
                  const p = new Date(); p.setDate(p.getDate() - 1);
                  setDataSelecionada(p.toISOString().split('T')[0]);
               }}>Ontem</Button>
               <Button variant="secondary" className="justify-start w-full border-primary/50 text-primary hover:bg-primary hover:text-white transition-colors" onClick={() => {
                  setDataSelecionada(new Date().toISOString().split('T')[0]);
               }}>Hoje</Button>
             </div>
           </CardContent>
        </Card>

        {/* Editor Central */}
        <Card className="flex-1 shadow-md border-primary/10 overflow-hidden flex flex-col">
           <CardHeader className="bg-primary/5 border-b p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Anotações de {dataSelecionada.split('-').reverse().join('/')}
                </CardTitle>
                {hasMudanca && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse">Não salvo</span>}
              </div>
           </CardHeader>
           
           <CardContent className="p-0 flex-1 relative min-h-[400px]">
             {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>}
             <Textarea 
               value={conteudoLocal}
               onChange={(e) => setConteudoLocal(e.target.value)}
               className="w-full h-full min-h-[400px] border-0 focus-visible:ring-0 rounded-none p-6 text-base resize-none bg-yellow-50/50 dark:bg-yellow-950/10 focus-visible:bg-yellow-50 dark:focus-visible:bg-yellow-900/10 placeholder:text-muted-foreground/50 transition-colors"
               placeholder="Escreva aqui..."
             />
           </CardContent>
           
           <CardFooter className="bg-muted/30 p-4 border-t flex justify-between gap-4">
              <Button onClick={limparAnotacao} variant="ghost" className="text-destructive hover:bg-destructive/10">
                 <Trash2 className="w-4 h-4 mr-2" /> Limpar
              </Button>
              <Button onClick={() => salvarAnotacao.mutate()} disabled={salvarAnotacao.isPending || !hasMudanca} className="min-w-[120px] btn-press shadow-sm text-md">
                 <Save className="w-4 h-4 mr-2" />
                 {salvarAnotacao.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
           </CardFooter>
        </Card>

      </div>
    </div>
  );
}
