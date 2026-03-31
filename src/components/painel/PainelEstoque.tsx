import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Archive, Save, Search, RefreshCw, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function PainelEstoque() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  
  // Estado local para armazenar os estoques editados na tela antes de salvar
  const [estoquesLocais, setEstoquesLocais] = useState<Record<string, number>>({});

  const { data: produtos, isLoading, refetch } = useQuery({
    queryKey: ['estoque-produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, categoria, estoque_atual, ativo')
        // .eq('ativo', true) // Pode querer ver inativos tbm
        .order('nome');
        
      if (error) throw error;
      return data;
    }
  });

  // Atualiza o estado local quando os dados chegam
  useEffect(() => {
    if (produtos) {
      const inicial: Record<string, number> = {};
      produtos.forEach(p => {
        inicial[p.id] = p.estoque_atual;
      });
      setEstoquesLocais(inicial);
    }
  }, [produtos]);

  const handleChangeEstoque = (id: string, valor: string) => {
    const val = parseInt(valor, 10);
    if (!isNaN(val)) {
      setEstoquesLocais(prev => ({ ...prev, [id]: val }));
    }
  };

  const salvarEstoqueMutation = useMutation({
    mutationFn: async (id: string) => {
      const novoEstoque = estoquesLocais[id];
      const { error } = await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Estoque atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Invalida o do outro painel tbm
    },
    onError: (erro) => {
      toast({ title: 'Erro ao salvar estoque', description: erro.message, variant: 'destructive' });
    }
  });

  const salvarTodosMutation = useMutation({
    mutationFn: async () => {
      // Cria promises para todos que mudaram
      const promessas = produtos?.map(p => {
         if (p.estoque_atual !== estoquesLocais[p.id]) {
            return supabase.from('produtos').update({ estoque_atual: estoquesLocais[p.id] }).eq('id', p.id);
         }
         return null;
      }).filter(Boolean);
      
      if(promessas && promessas.length > 0) {
        await Promise.all(promessas as any);
      }
    },
    onSuccess: () => {
      toast({ title: 'Todos estoques sincronizados!' });
      queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    }
  });

  const produtosFiltrados = produtos?.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const temAlteracao = produtos?.some(p => p.estoque_atual !== estoquesLocais[p.id]);

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
             <Archive className="w-8 h-8 text-primary" /> Ajuste Rápido de Estoque
          </h2>
          <p className="text-muted-foreground mt-1">Altere a quantidade de itens disponíveis rapidamente.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> Recarregar</Button>
           <Button 
             onClick={() => salvarTodosMutation.mutate()} 
             disabled={!temAlteracao || salvarTodosMutation.isPending}
             className="shadow-md"
           >
              <Save className="w-4 h-4 mr-2" /> 
              {salvarTodosMutation.isPending ? 'Salvando...' : 'Salvar Todos Alterados'}
           </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar produto por nome ou categoria..." 
          className="pl-10 h-12 text-lg rounded-xl shadow-sm border-border/50 bg-card"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                <th className="text-left p-4 font-bold">Produto / Categoria</th>
                <th className="text-center p-4 font-bold">Status</th>
                <th className="text-center p-4 font-bold w-32">Estoque No DB</th>
                <th className="text-center p-4 font-bold w-48">Novo Estoque</th>
                <th className="text-right p-4 font-bold w-24">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                 <tr><td colSpan={5} className="text-center p-12 text-muted-foreground"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : produtosFiltrados?.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="text-center p-12 text-muted-foreground">
                     <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                     Nenhum produto encontrado.
                   </td>
                 </tr>
              ) : (
                produtosFiltrados?.map((p: any) => {
                  const valorLocal = estoquesLocais[p.id] ?? p.estoque_atual;
                  const alterado = valorLocal !== p.estoque_atual;
                  
                  return (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${alterado ? 'bg-amber-500/5' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-base">{p.nome}</div>
                        <div className="text-xs text-muted-foreground uppercase">{p.categoria}</div>
                      </td>
                      <td className="p-4 text-center">
                         {!p.ativo && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                      </td>
                      <td className="p-4 text-center">
                         <div className={`font-mono text-lg font-bold ${p.estoque_atual < 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {p.estoque_atual}
                         </div>
                      </td>
                      <td className="p-4">
                         <div className="flex items-center justify-center">
                           <Input 
                              type="number" 
                              min="0"
                              value={valorLocal}
                              onChange={(e) => handleChangeEstoque(p.id, e.target.value)}
                              className={`w-24 text-center font-bold text-lg h-10 ${alterado ? 'border-amber-500 ring-2 ring-amber-500/20' : ''}`}
                           />
                         </div>
                      </td>
                      <td className="p-4 text-right">
                         <Button 
                           size="sm" 
                           variant={alterado ? "default" : "secondary"}
                           disabled={!alterado || salvarEstoqueMutation.isPending}
                           onClick={() => salvarEstoqueMutation.mutate(p.id)}
                         >
                           {salvarEstoqueMutation.isPending ? '...' : 'Salvar'}
                         </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
