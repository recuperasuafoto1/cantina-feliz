import { useTema, TEMAS, type TemaId } from '@/contexts/TemaContext';
import { cn } from '@/lib/utils';

export function PainelConfiguracoes() {
  const { temaAtual, mudarTema } = useTema();

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-extrabold">Configurações</h2>

      {/* Seletor de Tema */}
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <h3 className="font-bold text-lg">🎨 Tema de Cores</h3>
        <p className="text-sm text-muted-foreground">Escolha o visual da cantina</p>

        <div className="grid grid-cols-2 gap-3">
          {TEMAS.map(tema => (
            <button
              key={tema.id}
              onClick={() => mudarTema(tema.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all btn-press",
                temaAtual === tema.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-2xl">{tema.emoji}</span>
              <p className="font-bold mt-1">{tema.nome}</p>
              {temaAtual === tema.id && (
                <span className="text-xs text-primary font-bold">✓ Ativo</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
