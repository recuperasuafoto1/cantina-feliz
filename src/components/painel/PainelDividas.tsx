import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Receipt, Plus, AlertCircle, CheckCircle, Trash2, CalendarDays, Wallet, CalendarIcon } from 'lucide-react';

const formSchema = z.object({
  id: z.string().optional(),
  crianca_id: z.string().min(1, 'Selecione a criança / cliente'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  data_vencimento: z.string().nullable().optional(),
  pago: z.boolean().default(false),
});

type DividaFormValues = z.infer<typeof formSchema>;

export function PainelDividas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [dividaEditando, setDividaEditando] = useState<DividaFormValues | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'venceHoje' | 'atrasadas' | 'pagas'>('todas');

  const form = useForm<DividaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { crianca_id: '', valor: 0, data_vencimento: '', pago: false }
  });

  const { data: criancas } = useQuery({
    queryKey: ['clientes-ativos'],
    queryFn: async () => {
      const { data } = await supabase.from('criancas_clientes').select('id, nome').eq('ativo', true).order('nome');
      return data || [];
    }
  });

  const { data: dividas, isLoading } = useQuery({
    queryKey: ['dividas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dividas')
        .select('*, criancas_clientes(nome)')
        .order('data_vencimento', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    }
  });

  const salvarMutation = useMutation({
    mutationFn: async (valores: DividaFormValues) => {
      const { id, ...dadosBase } = valores;
      const dataParaEnviar = {
         ...dadosBase,
         data_vencimento: dadosBase.data_vencimento || null
      };
      if (id) {
        const { error } = await supabase.from('dividas').update(dataParaEnviar).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dividas').insert([dataParaEnviar as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast({ title: 'Sucesso!', description: 'Dívida registrada com sucesso.' });
      setModalAberto(false);
      form.reset();
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, pagoAtual }: { id: string, pagoAtual: boolean }) => {
      const { error } = await supabase.from('dividas').update({ pago: !pagoAtual }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast({ title: 'Status atualizado com sucesso!' });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dividas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast({ title: 'Dívida excluída!' });
      setModalAberto(false);
    }
  });

  const abrirModalNovo = () => {
    setDividaEditando(null);
    form.reset({ crianca_id: '', valor: 0, data_vencimento: '', pago: false });
    setModalAberto(true);
  };

  const hojeStr = new Date().toISOString().split('T')[0];

  const dividasFiltradas = dividas?.filter(d => {
    if (filtro === 'todas') return !d.pago; // mostrar pendentes por padrao se for 'todas'
    if (filtro === 'pagas') return d.pago;
    
    if (d.pago) return false; // Nao mostra pagas nos testes de dias
    
    const isVencida = d.data_vencimento && d.data_vencimento < hojeStr;
    const isVenceHoje = d.data_vencimento === hojeStr;
    
    if (filtro === 'atrasadas') return isVencida;
    if (filtro === 'venceHoje') return isVenceHoje;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" /> Contas a Receber (Dívidas)
          </h2>
          <p className="text-muted-foreground mt-1">Gerencie fiados e débitos não pagos dos clientes.</p>
        </div>
        <Button onClick={abrirModalNovo} className="btn-press shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Nova Conta
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filtro === 'todas' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro('todas')} className="rounded-full">Pendentes</Button>
        <Button variant={filtro === 'venceHoje' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro('venceHoje')} className="rounded-full text-amber-600 border-amber-200">
           Vence Hoje
           <Badge variant="secondary" className="ml-2 bg-amber-100">{dividas?.filter(d => d.data_vencimento === hojeStr && !d.pago).length || 0}</Badge>
        </Button>
        <Button variant={filtro === 'atrasadas' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro('atrasadas')} className="rounded-full text-destructive border-red-200">
           Atrasadas
           <Badge variant="secondary" className="ml-2 bg-red-100">{dividas?.filter(d => d.data_vencimento && d.data_vencimento < hojeStr && !d.pago).length || 0}</Badge>
        </Button>
        <Button variant={filtro === 'pagas' ? 'default' : 'outline'} size="sm" onClick={() => setFiltro('pagas')} className="rounded-full text-green-600 border-green-200">Histórico Pagas</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>
      ) : dividasFiltradas?.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
             <AlertCircle className="w-12 h-12 opacity-20 mb-4" />
             <p className="text-lg font-bold">Nenhuma conta encontrada nesta categoria.</p>
             {filtro === 'atrasadas' && <p className="text-sm mt-1">Ótimas notícias! Ninguém está com pagamento atrasado.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dividasFiltradas?.map(d => {
            const isVencida = !d.pago && d.data_vencimento && d.data_vencimento < hojeStr;
            const isVenceHoje = !d.pago && d.data_vencimento === hojeStr;
            const bgClass = d.pago ? 'bg-muted opacity-60 grayscale-[0.3]' : isVencida ? 'border-destructive/50 bg-red-50/10 dark:bg-red-950/20' : isVenceHoje ? 'border-amber-400/50 bg-amber-50/10 dark:bg-amber-950/20' : 'bg-card';
            
            return (
              <Card key={d.id} className={`transition-all hover:shadow-md ${bgClass}`}>
                <CardContent className="p-5 flex flex-col h-full">
                   <div className="flex justify-between items-start mb-4">
                      <div className="font-bold text-lg truncate pr-2" title={d.criancas_clientes?.nome}>{d.criancas_clientes?.nome || 'Cliente Apagado'}</div>
                      <div className="font-black text-xl whitespace-nowrap">R$ {d.valor.toFixed(2).replace('.', ',')}</div>
                   </div>
                   
                   <div className="flex-1 space-y-3">
                     <div className="flex items-center text-sm font-semibold text-muted-foreground gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {d.data_vencimento ? `Vence: ${d.data_vencimento.split('-').reverse().join('/')}` : 'Sem Vencimento'}
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {isVencida && <Badge variant="destructive" className="animate-pulse">Atrasada</Badge>}
                        {isVenceHoje && <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">Vence Hoje</Badge>}
                        {d.pago && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pago</Badge>}
                     </div>
                   </div>

                   <div className="pt-4 mt-4 border-t flex gap-2">
                      <Button
                        variant={d.pago ? 'outline' : 'default'}
                        className={`flex-1 ${!d.pago ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                        onClick={() => toggleStatusMutation.mutate({ id: d.id, pagoAtual: d.pago })}
                      >
                         <CheckCircle className="w-4 h-4 mr-2" />
                         {d.pago ? 'Reabrir' : 'Dar Baixa'}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => {
                        if(confirm('Atenção: Apenas exclua dívidas incorretas. Para quitar, clique em Dar Baixa. Tem certeza que quer EXCLUIR do sistema?')) {
                           excluirMutation.mutate(d.id);
                        }
                      }}>
                         <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL NOVA DÍVIDA */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Wallet className="w-5 h-5 text-primary" /> Nova Conta a Receber
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => salvarMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="crianca_id" render={({ field }) => (
                <FormItem><FormLabel>Cliente devedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {criancas?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valor" render={({ field }) => (
                  <FormItem><FormLabel>Valor (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="data_vencimento" render={({ field }) => (
                  <FormItem><FormLabel>Vencimento</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
                )} />
              </div>

              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? 'Salvando...' : 'Registrar Conta'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
