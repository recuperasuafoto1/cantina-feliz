import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputQuantidadeProps {
  valor: number;
  onChange: (novoValor: number) => void;
  min?: number;
  max?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

export function InputQuantidade({ valor, onChange, min = 0, max = 99, tamanho = 'md' }: InputQuantidadeProps) {
  const tamanhos = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, valor - 1))}
        className={cn(
          tamanhos[tamanho],
          "rounded-full bg-muted flex items-center justify-center",
          "text-foreground hover:bg-primary hover:text-primary-foreground",
          "transition-colors btn-press min-w-[48px] min-h-[48px]"
        )}
        disabled={valor <= min}
        aria-label="Diminuir"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className={cn(
        "font-bold text-center min-w-[2ch]",
        tamanho === 'lg' ? 'text-2xl' : tamanho === 'md' ? 'text-lg' : 'text-base'
      )}>
        {valor}
      </span>

      <button
        onClick={() => onChange(Math.min(max, valor + 1))}
        className={cn(
          tamanhos[tamanho],
          "rounded-full bg-primary flex items-center justify-center",
          "text-primary-foreground hover:bg-primary/90",
          "transition-colors btn-press min-w-[48px] min-h-[48px]"
        )}
        disabled={valor >= max}
        aria-label="Aumentar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
