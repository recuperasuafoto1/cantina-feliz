import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Baby, Settings, PlayCircle,
  LogOut, ChevronLeft, ChevronRight, UserCog, Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PainelSidebarProps {
  secaoAtiva: string;
  onMudarSecao: (secao: string) => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', nome: 'Dashboard', icone: LayoutDashboard },
  { id: 'produtos', nome: 'Produtos', icone: Package },
  { id: 'funcionarios', nome: 'Funcionários', icone: UserCog },
  { id: 'configuracoes', nome: 'Configurações', icone: Settings },
];

export function PainelSidebar({ secaoAtiva, onMudarSecao }: PainelSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside className={cn(
      "h-screen sticky top-0 bg-card border-r flex flex-col transition-all duration-300",
      colapsado ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="p-4 border-b flex items-center gap-2">
        {!colapsado && <span className="font-extrabold text-lg text-foreground">🍽️ Cantina</span>}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="ml-auto w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
        >
          {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1">
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onMudarSecao(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors btn-press",
              secaoAtiva === item.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <item.icone className="w-5 h-5 flex-shrink-0" />
            {!colapsado && <span>{item.nome}</span>}
          </button>
        ))}
      </nav>

      {/* Botão Operador */}
      <div className="p-2 space-y-1">
        <button
          onClick={() => navigate('/operador')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-extrabold",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-press"
          )}
        >
          <PlayCircle className="w-5 h-5 flex-shrink-0" />
          {!colapsado && <span>Começar Trabalho</span>}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted btn-press"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!colapsado && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
