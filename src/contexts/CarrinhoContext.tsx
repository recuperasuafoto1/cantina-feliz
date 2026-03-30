import React, { createContext, useContext, useState } from 'react';

// Tipo do item no carrinho
export interface ItemCarrinho {
  produto_id: string;
  nome: string;
  preco: number;
  imagem_url: string;
  quantidade: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>) => void;
  removerItem: (produto_id: string) => void;
  alterarQuantidade: (produto_id: string, quantidade: number) => void;
  limparCarrinho: () => void;
  total: number;
  totalItens: number;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const adicionarItem = (item: Omit<ItemCarrinho, 'quantidade'>) => {
    setItens(prev => {
      const existente = prev.find(i => i.produto_id === item.produto_id);
      if (existente) {
        return prev.map(i =>
          i.produto_id === item.produto_id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
  };

  const removerItem = (produto_id: string) => {
    setItens(prev => prev.filter(i => i.produto_id !== produto_id));
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

  const limparCarrinho = () => setItens([]);

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <CarrinhoContext.Provider value={{
      itens, adicionarItem, removerItem, alterarQuantidade, limparCarrinho, total, totalItens
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
