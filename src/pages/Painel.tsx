import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, UtensilsCrossed, User } from 'lucide-react';
import { PainelDashboard } from '@/components/painel/PainelDashboard';
import { PainelSidebar } from '@/components/painel/PainelSidebar';
import { PainelProdutos } from '@/components/painel/PainelProdutos';
import { PainelFuncionarios } from '@/components/painel/PainelFuncionarios';
import { PainelConfiguracoes } from '@/components/painel/PainelConfiguracoes';

export default function Painel() {
  const { autenticado, login } = useAuth();
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

  // Tela de login
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

  // Renderiza a seção ativa
  const renderSecao = () => {
    switch (secaoAtiva) {
      case 'dashboard': return <PainelDashboard />;
      case 'produtos': return <PainelProdutos />;
      case 'funcionarios': return <PainelFuncionarios />;
      case 'configuracoes': return <PainelConfiguracoes />;
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
