import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Produto = {
  id: string; nome: string; descricao: string | null; preco: number;
  categoria: string; estoque_atual: number; ativo: boolean;
};

export function PainelProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    async function buscar() {
      const { data } = await supabase.from('produtos').select('*').order('nome');
      if (data) setProdutos(data as unknown as Produto[]);
    }
    buscar();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">Produtos</h2>
        <Button className="btn-press">
          <Plus className="w-4 h-4 mr-1" /> Novo Produto
        </Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-bold">Produto</th>
              <th className="text-left p-3 font-bold">Categoria</th>
              <th className="text-right p-3 font-bold">Preço</th>
              <th className="text-right p-3 font-bold">Estoque</th>
              <th className="text-right p-3 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">Nenhum produto cadastrado</td></tr>
            ) : (
              produtos.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-bold">{p.nome}</td>
                  <td className="p-3 text-muted-foreground capitalize">{p.categoria}</td>
                  <td className="p-3 text-right">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</td>
                  <td className="p-3 text-right">{p.estoque_atual}</td>
                  <td className="p-3 text-right">
                    <button className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
