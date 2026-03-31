import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Baby, Phone, Wallet, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast as toaster } from 'sonner';

const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "Nome obrigatório"),
  nome_mae: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  saldo_credito: z.coerce.number().min(0, "Saldo não pode ser negativo"),
  ativo: z.boolean().default(true),
});

type ClienteFormValues = z.infer<typeof formSchema>;

export function PainelClientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteFormValues | null>(null);

  const [modalCreditoAberto, setModalCreditoAberto] = useState(false);
  const [clienteCredito, setClienteCredito] = useState<any>(null);
  const [valorCredito, setValorCredito] = useState('');
  const [descCredito, setDescCredito] = useState('');

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', nome_mae: '', whatsapp: '', saldo_credito: 0, ativo: true }
  });

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('criancas_clientes').select('*').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const salvarMutation = useMutation({
    mutationFn: async (valores: ClienteFormValues) => {
      const { id, ...dadosBase } = valores;
      if (id) {
        const { error } = await supabase.from('criancas_clientes').update(dadosBase).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('criancas_clientes').insert([dadosBase]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toaster.success('Cliente salvo com sucesso.');
      setModalAberto(false);
      form.reset();
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('criancas_clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toaster.success('Cliente removido com sucesso.');
    }
  });

  const adicionarCreditoMutation = useMutation({
    mutationFn: async () => {
      if (!clienteCredito) return;
      const valorInserir = parseFloat(valorCredito.replace(',', '.'));
      if (isNaN(valorInserir) || valorInserir <= 0) throw new Error("Valor inválido");

      const novoSaldo = Number(clienteCredito.saldo_credito || 0) + valorInserir;

      // Atualiza cliente
      const { error: errCli } = await supabase.from('criancas_clientes').update({
         saldo_credito: novoSaldo
      }).eq('id', clienteCredito.id);
      if (errCli) throw errCli;

      // Grava histórico
      const { error: errHist } = await supabase.from('movimentacoes_credito').insert({
         crianca_id: clienteCredito.id,
         valor: valorInserir,
         tipo: 'entrada',
         descricao: descCredito || 'Recarga de Saldo'
      });
      if (errHist) throw errHist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toaster.success(`Crédito adicionado a ${clienteCredito?.nome}`);
      setModalCreditoAberto(false);
      setValorCredito('');
      setDescCredito('');
    },
    onError: (e: any) => toaster.error(`Erro: ${e.message}`)
  });

  const abrirModalNovo = () => {
    setClienteEditando(null);
    form.reset({ nome: '', nome_mae: '', whatsapp: '', saldo_credito: 0, ativo: true });
    setModalAberto(true);
  };

  const abrirModalEditar = (cliente: any) => {
    setClienteEditando(cliente);
    form.reset({
      id: cliente.id,
      nome: cliente.nome,
      nome_mae: cliente.nome_mae || '',
      whatsapp: cliente.whatsapp || '',
      saldo_credito: cliente.saldo_credito,
      ativo: cliente.ativo
    });
    setModalAberto(true);
  };

  const abrirModalCredito = (cliente: any) => {
    setClienteCredito(cliente);
    setValorCredito('');
    setDescCredito('');
    setModalCreditoAberto(true);
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10 flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Baby className="w-8 h-8 text-primary" /> Clientes / Crianças
          </h2>
          <p className="text-muted-foreground mt-1">Registre os clientes para pedidos em conta ou recargas pré-pagas.</p>
        </div>
        <Button onClick={abrirModalNovo} className="btn-press shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden shadow-sm mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
              <th className="text-left p-4 font-bold">Nome</th>
              <th className="text-left p-4 font-bold">Responsável</th>
              <th className="text-left p-4 font-bold">Contato (WhatsApp)</th>
              <th className="text-right p-4 font-bold">Saldo Crédito</th>
              <th className="text-center p-4 font-bold">Status</th>
              <th className="text-right p-4 font-bold pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
               <tr><td colSpan={6} className="text-center p-8"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"/></td></tr>
            ) : clientes?.length === 0 ? (
               <tr>
                 <td colSpan={6} className="text-center p-16 text-muted-foreground">
                   <Baby className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   Nenhum cliente cadastrado.
                 </td>
               </tr>
            ) : (
              clientes?.map((c: any) => (
                <tr key={c.id} className={`hover:bg-muted/30 transition-colors ${!c.ativo ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                  <td className="p-4 font-bold text-base text-foreground pl-6 flex items-center gap-2">
                     {c.nome}
                  </td>
                  <td className="p-4 font-medium">{c.nome_mae || '-'}</td>
                  <td className="p-4 flex items-center gap-1 font-mono text-xs">
                     {c.whatsapp ? <><Phone className="w-3 h-3 text-muted-foreground" /> {c.whatsapp}</> : '-'}
                  </td>
                  <td className="p-4 text-right">
                     <span className="font-bold text-base text-green-600 dark:text-green-400 bg-green-50 px-3 py-1 rounded-full dark:bg-green-900/30">
                        R$ {Number(c.saldo_credito).toFixed(2).replace('.', ',')}
                     </span>
                  </td>
                  <td className="p-4 text-center">
                     {c.ativo ? <span className="text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-bold">Ativo</span> : 
                                <span className="text-xs text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full font-bold">Inativo</span>}
                  </td>
                  <td className="p-4 text-right pr-6 gap-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => abrirModalCredito(c)} className="btn-press border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 dark:text-green-400">
                       <PlusCircle className="w-4 h-4 mr-1" /> Crédito
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => abrirModalEditar(c)} className="bg-muted hover:bg-muted-foreground/20 btn-press">
                       <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CLIENTE */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{clienteEditando ? '✏️ Editar Cliente' : '👶 Novo Cliente/Criança'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => salvarMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome da Criança / Cliente</FormLabel>
                  <FormControl><Input placeholder="Ex: Joãozinho Oliveira" {...field} /></FormControl>
                <FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="nome_mae" render={({ field }) => (
                  <FormItem><FormLabel>Pai / Mãe / Resp</FormLabel>
                    <FormControl><Input placeholder="Responsável" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem><FormLabel>WhatsApp (Apenas Nº)</FormLabel>
                    <FormControl><Input placeholder="(99) 99999-9999" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {!clienteEditando && (
                 <FormField control={form.control} name="saldo_credito" render={({ field }) => (
                   <FormItem><FormLabel>Saldo Crédito Inicial (R$)</FormLabel>
                     <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                     <p className="text-[11px] text-muted-foreground">Depois de criado, adicione fundos pelo botão "Crédito"</p>
                   </FormItem>
                 )} />
              )}

              <FormField control={form.control} name="ativo" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-4 mt-4 bg-muted/20">
                  <div>
                    <FormLabel>Cadastro Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">Desative caso a criança mude de escola.</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <DialogFooter className="pt-6">
                {clienteEditando && (
                  <Button type="button" variant="ghost" className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                     if(confirm('Tem certeza? Isso apaga todo o histórico dele.')) excluirMutation.mutate(clienteEditando.id!);
                  }}>
                     <Trash2 className="w-4 h-4 mr-2" /> Excluir Cliente
                  </Button>
                )}
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={salvarMutation.isPending} className="btn-press">
                   {salvarMutation.isPending ? 'Salvando...' : 'Salvar Cadastro'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* MODAL DE CRÉDITO */}
      <Dialog open={modalCreditoAberto} onOpenChange={setModalCreditoAberto}>
        <DialogContent className="max-w-sm sm:rounded-2xl text-center">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-green-700 flex flex-col items-center gap-2">
               <Wallet className="w-10 h-10 text-green-500 mb-1" /> 
               Recarga de Crédito
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-base text-muted-foreground">Para: <span className="font-bold text-foreground">{clienteCredito?.nome}</span></p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-bold block text-left">Valor a adicionar (R$):</label>
                 <Input 
                   type="number" step="0.01" placeholder="Ex: 50,00"
                   value={valorCredito}
                   onChange={e => setValorCredito(e.target.value)}
                   className="h-14 text-center font-black text-2xl border-2 focus-visible:border-green-500 bg-green-50 dark:bg-green-950/20"
                 />
              </div>
              <div className="space-y-2 mb-2">
                 <label className="text-sm font-bold block text-left">Descrição (Opcional):</label>
                 <Input 
                   placeholder="Ex: Recarga pelo Pai (WhatsApp)"
                   value={descCredito}
                   onChange={e => setDescCredito(e.target.value)}
                   className="bg-muted text-sm"
                 />
              </div>
            </div>

            <Button onClick={() => adicionarCreditoMutation.mutate()} disabled={adicionarCreditoMutation.isPending || !valorCredito} className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white btn-press">
               CONFIRMAR RECARGA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
