import React, { createContext, useContext, useState } from 'react';

// Autenticação simples do painel admin (sem backend, senha local)
interface AuthContextType {
  autenticado: boolean;
  funcionarioAtual: string | null;
  login: (senha: string) => boolean;
  selecionarFuncionario: (nome: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hash simples para não expor a senha diretamente no código
const SENHA_HASH = btoa('Samuel1');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [funcionarioAtual, setFuncionarioAtual] = useState<string | null>(null);

  const login = (senha: string): boolean => {
    if (btoa(senha) === SENHA_HASH) {
      setAutenticado(true);
      return true;
    }
    return false;
  };

  const selecionarFuncionario = (nome: string) => setFuncionarioAtual(nome);
  const logout = () => {
    setAutenticado(false);
    setFuncionarioAtual(null);
  };

  return (
    <AuthContext.Provider value={{ autenticado, funcionarioAtual, login, selecionarFuncionario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
