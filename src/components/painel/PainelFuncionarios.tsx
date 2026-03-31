import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, UserCog, User, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "Nome obrigatório"),
  ativo: z.boolean().default(true),
});

type FuncionarioFormValues = z.infer<typeof formSchema>;

export function PainelFuncionarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState<FuncionarioFormValues | null>(null);

  const form = useForm<FuncionarioFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', ativo: true }
  });

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('funcionarios').select('*').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const salvarMutation = useMutation({
    mutationFn: async (valores: FuncionarioFormValues) => {
      const { id, ...dadosBase } = valores;
      if (id) {
        const { error } = await supabase.from('funcionarios').update(dadosBase).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('funcionarios').insert([dadosBase]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      // Invalida a query de funcionarios ativos tbm para refletir no login
      queryClient.invalidateQueries({ queryKey: ['funcionarios-ativos'] });
      toast({ title: 'Sucesso!', description: 'Funcionário salvo com sucesso.' });
      setModalAberto(false);
      form.reset();
    },
    onError: (erro) => {
      toast({ title: 'Erro ao salvar', description: erro.message, variant: 'destructive' });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-ativos'] });
      toast({ title: 'Sucesso!', description: 'Funcionário excluído com sucesso.' });
      setModalAberto(false);
    }
  });

  const abrirModalNovo = () => {
    setFuncionarioEditando(null);
    form.reset({ nome: '', ativo: true });
    setModalAberto(true);
  };

  const abrirModalEditar = (f: any) => {
    setFuncionarioEditando(f);
    form.reset({
      id: f.id,
      nome: f.nome,
      ativo: f.ativo
    });
    setModalAberto(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Funcionários</h2>
          <p className="text-muted-foreground">Gerencie quem tem acesso ao sistema de vendas.</p>
        </div>
        <Button onClick={abrirModalNovo} className="btn-press shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Novo Funcionário
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios?.map((f: any) => (
            <div key={f.id} className={`flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all ${!f.ativo ? 'opacity-60 grayscale-[0.3]' : ''}`}>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {f.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-base">{f.nome}</p>
                  <p className="text-xs font-semibold mt-0.5 opacity-80 flex items-center gap-1">
                    {f.ativo ? <span className="text-green-600 dark:text-green-400">● Ativo</span> : <span className="text-red-600 dark:text-red-400">● Inativo</span>}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => abrirModalEditar(f)} className="ml-2">
                 <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          
          {funcionarios?.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <UserCog className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum funcionário cadastrado no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {funcionarioEditando ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => salvarMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome Completo</FormLabel>
                  <FormControl><Input placeholder="Ex: Samuel" {...field} /></FormControl>
                <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="ativo" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-4">
                  <div>
                    <FormLabel>Acesso Ativo</FormLabel>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Permite entrar no painel e PDV</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                {funcionarioEditando && (
                   <Button type="button" variant="destructive" className="mr-auto" onClick={() => {
                      if(confirm('Tem certeza? Isso pode afetar os pedidos ligados a este funcionário.')) {
                         excluirMutation.mutate(funcionarioEditando.id!);
                      }
                   }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                   </Button>
                )}
                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={salvarMutation.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
