import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Tag, Package, ImageIcon, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "Nome obrigatório"),
  descricao: z.string().optional(),
  preco: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  estoque_atual: z.coerce.number().min(0, "Estoque deve ser maior ou igual a zero"),
  ativo: z.boolean().default(true),
  eh_order_bump_para: z.string().nullable().optional(),
  tem_upsell_para: z.string().nullable().optional(),
  imagem_url: z.string().nullable().optional(),
});

type ProdutoFormValues = z.infer<typeof formSchema>;

const CATEGORIAS = ['Salgados', 'Bebidas', 'Doces', 'Combos', 'Outros'];

export function PainelProdutos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoFormValues | null>(null);

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '', descricao: '', preco: 0, categoria: '', estoque_atual: 0, 
      ativo: true, eh_order_bump_para: null, tem_upsell_para: null, imagem_url: null
    }
  });

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('*').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const salvarProdutation = useMutation({
    mutationFn: async (valores: ProdutoFormValues) => {
      const { id, ...dadosBase } = valores;
      
      const dadosInsercao = {
        ...dadosBase,
        eh_order_bump_para: dadosBase.eh_order_bump_para === 'none' ? null : dadosBase.eh_order_bump_para,
        tem_upsell_para: dadosBase.tem_upsell_para === 'none' ? null : dadosBase.tem_upsell_para,
      };

      if (id) {
        const { error } = await supabase.from('produtos').update(dadosInsercao).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('produtos').insert([dadosInsercao]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Sucesso!', description: 'Produto salvo com sucesso.' });
      setModalAberto(false);
      form.reset();
    },
    onError: (erro) => {
      toast({ title: 'Erro ao salvar', description: erro.message, variant: 'destructive' });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Sucesso!', description: 'Produto removido com sucesso.' });
    }
  });

  const abrirModalNovo = () => {
    setProdutoEditando(null);
    form.reset({
      nome: '', descricao: '', preco: 0, categoria: '', estoque_atual: 0, 
      ativo: true, eh_order_bump_para: 'none', tem_upsell_para: 'none', imagem_url: ''
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (produto: any) => {
    setProdutoEditando(produto);
    form.reset({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      categoria: produto.categoria,
      estoque_atual: produto.estoque_atual,
      ativo: produto.ativo,
      eh_order_bump_para: produto.eh_order_bump_para || 'none',
      tem_upsell_para: produto.tem_upsell_para || 'none',
      imagem_url: produto.imagem_url || ''
    });
    setModalAberto(true);
  };

  const onSubmit = (valores: ProdutoFormValues) => {
    salvarProdutation.mutate(valores);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Produtos</h2>
            <p className="text-muted-foreground">Gerencie o cardápio, estoque e vendas adicionais.</p>
         </div>
        <Button onClick={abrirModalNovo} className="btn-press shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Novo Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {produtos?.map((p: any) => (
            <Card key={p.id} className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${!p.ativo ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              <div className="h-32 bg-muted flex items-center justify-center relative border-b">
                 {p.imagem_url ? (
                   <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                 ) : (
                   <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                 )}
                 {!p.ativo && (
                   <Badge variant="destructive" className="absolute top-2 right-2">Inativo</Badge>
                 )}
              </div>
              <CardContent className="p-4 flex-1 flex flex-col text-left">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold line-clamp-1 flex-1 pr-2">{p.nome}</h3>
                </div>
                <div className="text-muted-foreground text-xs uppercase font-medium mb-3">{p.categoria}</div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center text-muted-foreground"><Tag className="w-3.5 h-3.5 mr-1" /> Preço</span>
                    <span className="font-bold">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center text-muted-foreground"><Package className="w-3.5 h-3.5 mr-1" /> Estoque</span>
                    <span className={`font-bold ${p.estoque_atual < 5 ? 'text-destructive' : ''}`}>{p.estoque_atual}</span>
                  </div>
                  
                  <div className="pt-3 mt-2 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => abrirModalEditar(p)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {produtos?.length === 0 && (
             <div className="col-span-full py-20 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum produto cadastrado no momento.</p>
             </div>
          )}
        </div>
      )}

      {/* Modal Novo/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{produtoEditando ? '✏️ Editar Produto' : '📦 Novo Produto'}</DialogTitle>
            <DialogDescription>Preencha as informações do produto, preços e estratégias de venda cruzada.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Produto</FormLabel>
                    <FormControl><Input placeholder="Ex: Coxinha de Frango" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CATEGORIAS.map(cat => <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="preco" render={({ field }) => (
                  <FormItem><FormLabel>Preço (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="estoque_atual" render={({ field }) => (
                  <FormItem><FormLabel>Estoque Atual</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem><FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl><Textarea className="resize-none h-20" placeholder="Ingredientes ou detalhes..." {...field} value={field.value || ''} /></FormControl>
                <FormMessage /></FormItem>
              )} />

              {/* Upload de imagem placeholder */}
              <div className="border border-dashed border-border rounded-xl p-4 bg-muted/20">
                <FormLabel className="mb-2 block">Imagem do Produto (Supabase Storage)</FormLabel>
                <div className="flex items-center gap-3">
                   <Button type="button" variant="secondary" size="sm">Fazer Upload</Button>
                   <span className="text-xs text-muted-foreground">Funcionalidade de upload entrará na v2. Por enquanto será sem imagem ou insira URL.</span>
                </div>
              </div>

              <div className="border rounded-xl p-4 bg-primary/5 space-y-4">
                 <h4 className="font-bold flex items-center gap-2 text-sm">
                   <Package className="w-4 h-4 text-primary" /> 
                   Estratégias de Aumento de Ticket (Cross-sell/Upsell)
                 </h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="eh_order_bump_para" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oferecer como Order Bump no produto:</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger></FormControl>
                        <SelectContent className="max-h-[200px]">
                          <SelectItem value="none">Nenhum</SelectItem>
                          {produtos?.filter((p:any) => p.id !== produtoEditando?.id).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Este produto será oferecido extra ao colocar o produto acima no carrinho.
                      </FormDescription>
                    <FormMessage /></FormItem>
                   )} />

                   <FormField control={form.control} name="tem_upsell_para" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oferecer Upsell (Upgrade) para:</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger></FormControl>
                        <SelectContent className="max-h-[200px]">
                          <SelectItem value="none">Nenhum</SelectItem>
                          {produtos?.filter((p:any) => p.id !== produtoEditando?.id).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Em vez deste produto, oferecer o upgrade selecionado ao finalizar.
                      </FormDescription>
                    <FormMessage /></FormItem>
                   )} />
                 </div>
              </div>

              <FormField control={form.control} name="ativo" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Produto Ativo</FormLabel>
                    <FormDescription>
                      Desative para esconder o produto do catálogo de vendas, sem excluí-lo.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                {produtoEditando && (
                  <Button type="button" variant="destructive" className="mr-auto" onClick={() => {
                     if(confirm('Tem certeza que deseja excluir esse produto?')) excluirMutation.mutate(produtoEditando.id!);
                  }}>
                     <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </Button>
                )}
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={salvarProdutation.isPending}>
                  {salvarProdutation.isPending ? 'Salvando...' : 'Salvar Produto'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
