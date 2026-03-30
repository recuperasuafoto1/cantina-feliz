import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de temas disponíveis na Cantina Marum
export type TemaId = 'tema-verao' | 'tema-ceu' | 'tema-pastel' | 'tema-frutas';

export interface TemaInfo {
  id: TemaId;
  nome: string;
  emoji: string;
}

export const TEMAS: TemaInfo[] = [
  { id: 'tema-verao', nome: 'Verão', emoji: '🌞' },
  { id: 'tema-ceu', nome: 'Céu', emoji: '☁️' },
  { id: 'tema-pastel', nome: 'Pastel', emoji: '🎨' },
  { id: 'tema-frutas', nome: 'Frutas', emoji: '🍋' },
];

interface TemaContextType {
  temaAtual: TemaId;
  mudarTema: (tema: TemaId) => void;
  temas: TemaInfo[];
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [temaAtual, setTemaAtual] = useState<TemaId>(() => {
    return (localStorage.getItem('cantina-tema') as TemaId) || 'tema-verao';
  });

  useEffect(() => {
    // Remove todas as classes de tema e aplica a atual
    const root = document.documentElement;
    TEMAS.forEach(t => root.classList.remove(t.id));
    root.classList.add(temaAtual);
    localStorage.setItem('cantina-tema', temaAtual);
  }, [temaAtual]);

  return (
    <TemaContext.Provider value={{ temaAtual, mudarTema: setTemaAtual, temas: TEMAS }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema deve ser usado dentro de TemaProvider');
  return ctx;
}
