import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, UtensilsCrossed, User } from 'lucide-react';
import { PainelDashboard } from '@/components/painel/PainelDashboard';
import { PainelSidebar } from '@/components/painel/PainelSidebar';
import { PainelProdutos } from '@/components/painel/PainelProdutos';
import { PainelFuncionarios } from '@/components/painel/PainelFuncionarios';
import { PainelConfiguracoes } from '@/components/painel/PainelConfiguracoes';
import { PainelEstoque } from '@/components/painel/PainelEstoque';
import { PainelClientes } from '@/components/painel/PainelClientes';
import { PainelCaixa } from '@/components/painel/PainelCaixa';
import { PainelDividas } from '@/components/painel/PainelDividas';
import { PainelAnotacoes } from '@/components/painel/PainelAnotacoes';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

export default function Painel() {
  const { autenticado, funcionarioAtual, login, selecionarFuncionario } = useAuth();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState('dashboard');

  const handleLogin = () => {
    if (login(senha)) {
      setErro(false);
    } else {
      setErro(true);
      setSenha('');
    }
  };

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionarios-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('ativo', true);
        
      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        return [];
      }
      return data || [];
    },
    enabled: autenticado && !funcionarioAtual,
  });

  // Se a consulta terminar e não houver funcionários, logar como 'Admin Admin'
  useEffect(() => {
    if (autenticado && !funcionarioAtual && funcionarios && funcionarios.length === 0) {
      selecionarFuncionario('Admin Default');
    }
  }, [autenticado, funcionarioAtual, funcionarios, selecionarFuncionario]);


  // Tela de login inicial
  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in text-center">
          <div className="flex flex-col items-center gap-2">
            <UtensilsCrossed className="w-12 h-12 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Cantina Marum</h1>
            <p className="text-sm text-muted-foreground">Painel Administrativo</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Digite a senha"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(false); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="pl-10 h-12 text-center text-lg rounded-xl"
              />
            </div>
            {erro && <p className="text-destructive text-sm font-bold">Senha incorreta!</p>}
            <Button onClick={handleLogin} className="w-full h-12 text-lg font-bold rounded-xl btn-press">
              Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de seleção de funcionário
  if (autenticado && !funcionarioAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in text-center">
          <div className="flex flex-col items-center gap-2 mb-8">
            <h1 className="text-2xl font-bold text-foreground">Quem está usando o sistema?</h1>
            <p className="text-sm text-muted-foreground">Selecione seu usuário para continuar</p>
          </div>
          
          {isLoading ? (
             <div className="flex justify-center p-8">
               <Progress value={33} className="w-[60%]" />
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {funcionarios?.map((f) => (
                <button
                  key={f.id}
                  onClick={() => selecionarFuncionario(f.nome)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent hover:scale-105 transition-all text-card-foreground"
                >
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {f.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-center line-clamp-2">{f.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderiza a seção ativa do painel admin
  const renderSecao = () => {
    switch (secaoAtiva) {
      case 'dashboard': return <PainelDashboard />;
      case 'caixa': return <PainelCaixa />;
      case 'produtos': return <PainelProdutos />;
      case 'funcionarios': return <PainelFuncionarios />;
      case 'configuracoes': return <PainelConfiguracoes />;
      case 'estoque': return <PainelEstoque />;
      case 'clientes': return <PainelClientes />;
      case 'dividas': return <PainelDividas />;
      case 'anotacoes': return <PainelAnotacoes />;
      default: return <PainelDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <PainelSidebar secaoAtiva={secaoAtiva} onMudarSecao={setSecaoAtiva} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {renderSecao()}
      </main>
    </div>
  );
}
