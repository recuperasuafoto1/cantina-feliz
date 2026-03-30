import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CardProdutoProps {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string;
  onAdicionar: () => void;
  indice?: number; // para stagger animation
}

export function CardProduto({ nome, descricao, preco, imagem_url, onAdicionar, indice = 0 }: CardProdutoProps) {
  const [animando, setAnimando] = useState(false);

  const handleClick = () => {
    setAnimando(true);
    onAdicionar();
    setTimeout(() => setAnimando(false), 400);
  };

  return (
    <div
      className="stagger-fade-in rounded-xl bg-card shadow-sm border overflow-hidden btn-press"
      style={{ animationDelay: `${indice * 60}ms` }}
    >
      {/* Imagem quadrada */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imagem_url || '/placeholder.svg'}
          alt={nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm leading-tight text-card-foreground">{nome}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{descricao}</p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-extrabold text-primary">
            R$ {preco.toFixed(2).replace('.', ',')}
          </span>
          <button
            onClick={handleClick}
            className={cn(
              "w-10 h-10 rounded-full bg-primary flex items-center justify-center",
              "text-primary-foreground shadow-md hover:shadow-lg transition-all",
              "btn-press min-w-[48px] min-h-[48px]",
              animando && "animate-bounce-once"
            )}
            aria-label={`Adicionar ${nome}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
