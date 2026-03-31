import React, { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';

// Tipo do item no carrinho
export interface ItemCarrinho {
  produto_id: string;
  nome: string;
  preco: number;
  imagem_url: string;
  quantidade: number;
  eh_bump?: boolean; // item adicionado via order bump
  bump_de?: string; // produto_id do item pai
}

// Dados de bump/upsell de um produto
export interface ProdutoBumpInfo {
  produto_id: string;
  nome: string;
  preco: number;
  imagem_url: string;
}

export interface UpsellInfo {
  item_original_id: string;
  item_original_nome: string;
  upsell: ProdutoBumpInfo;
  diferenca: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>, bumpInfo?: ProdutoBumpInfo) => void;
  removerItem: (produto_id: string) => void;
  alterarQuantidade: (produto_id: string, quantidade: number) => void;
  limparCarrinho: () => void;
  total: number;
  totalItens: number;
  // Order bump
  bumpsDisponiveis: Map<string, ProdutoBumpInfo>;
  bumpsAtivos: Set<string>; // produto_ids dos bumps ativados
  toggleBump: (produtoPaiId: string) => void;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [bumpsDisponiveis, setBumpsDisponiveis] = useState<Map<string, ProdutoBumpInfo>>(new Map());
  const [bumpsAtivos, setBumpsAtivos] = useState<Set<string>>(new Set());

  const adicionarItem = (item: Omit<ItemCarrinho, 'quantidade'>, bumpInfo?: ProdutoBumpInfo) => {
    setItens(prev => {
      const existente = prev.find(i => i.produto_id === item.produto_id && !i.eh_bump);
      if (existente) {
        return prev.map(i =>
          i.produto_id === item.produto_id && !i.eh_bump
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantidade: 1 }];
    });

    // Registrar bump disponível se existir
    if (bumpInfo) {
      setBumpsDisponiveis(prev => new Map(prev).set(item.produto_id, bumpInfo));
    }

    toast.success('Item adicionado!', { duration: 1500 });
  };

  const removerItem = (produto_id: string) => {
    setItens(prev => {
      // Remove o item e qualquer bump associado a ele
      return prev.filter(i => i.produto_id !== produto_id && i.bump_de !== produto_id);
    });
    // Limpar bump disponível e ativo
    setBumpsDisponiveis(prev => {
      const next = new Map(prev);
      next.delete(produto_id);
      return next;
    });
    setBumpsAtivos(prev => {
      const next = new Set(prev);
      next.delete(produto_id);
      return next;
    });
  };

  const alterarQuantidade = (produto_id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(produto_id);
      return;
    }
    setItens(prev => prev.map(i =>
      i.produto_id === produto_id ? { ...i, quantidade } : i
    ));
  };

  const toggleBump = (produtoPaiId: string) => {
    const bumpInfo = bumpsDisponiveis.get(produtoPaiId);
    if (!bumpInfo) return;

    setBumpsAtivos(prev => {
      const next = new Set(prev);
      if (next.has(produtoPaiId)) {
        // Desativar bump - remover do carrinho
        next.delete(produtoPaiId);
        setItens(p => p.filter(i => !(i.eh_bump && i.bump_de === produtoPaiId)));
      } else {
        // Ativar bump - adicionar ao carrinho
        next.add(produtoPaiId);
        setItens(p => [...p, {
          produto_id: bumpInfo.produto_id,
          nome: bumpInfo.nome,
          preco: bumpInfo.preco,
          imagem_url: bumpInfo.imagem_url,
          quantidade: 1,
          eh_bump: true,
          bump_de: produtoPaiId,
        }]);
      }
      return next;
    });
  };

  const limparCarrinho = () => {
    setItens([]);
    setBumpsDisponiveis(new Map());
    setBumpsAtivos(new Set());
  };

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <CarrinhoContext.Provider value={{
      itens, adicionarItem, removerItem, alterarQuantidade, limparCarrinho, total, totalItens,
      bumpsDisponiveis, bumpsAtivos, toggleBump,
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider');
  return ctx;
}
