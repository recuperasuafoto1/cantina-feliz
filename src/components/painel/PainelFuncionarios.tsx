import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, UserCog } from 'lucide-react';

export function PainelFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => {
    buscar();
  }, []);

  async function buscar() {
    const { data } = await supabase.from('funcionarios').select('*').order('nome') as any;
    if (data) setFuncionarios(data);
  }

  async function adicionar() {
    if (!novoNome.trim()) return;
    await supabase.from('funcionarios').insert({ nome: novoNome.trim(), ativo: true } as any);
    setNovoNome('');
    buscar();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-extrabold">Funcionários</h2>

      <div className="flex gap-2">
        <Input
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && adicionar()}
          placeholder="Nome do funcionário"
          className="max-w-xs"
        />
        <Button onClick={adicionar} className="btn-press">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {funcionarios.map((f: any) => (
          <div key={f.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold">{f.nome}</p>
              <p className="text-xs text-muted-foreground">{f.ativo ? '✅ Ativo' : '❌ Inativo'}</p>
            </div>
          </div>
        ))}
        {funcionarios.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum funcionário cadastrado</p>
        )}
      </div>
    </div>
  );
}
