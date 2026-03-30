
-- Tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  imagem_url TEXT DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'lanche' CHECK (categoria IN ('lanche', 'bebida', 'doce', 'snack')),
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  eh_order_bump_para UUID,
  tem_upsell_para UUID,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de crianças/clientes
CREATE TABLE public.criancas_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_mae TEXT,
  whatsapp TEXT,
  saldo_credito NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de controle de números de pedido
CREATE TABLE public.controle_numeros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_atual DATE NOT NULL DEFAULT CURRENT_DATE,
  ultimo_numero INTEGER NOT NULL DEFAULT 10,
  loja_aberta BOOLEAN NOT NULL DEFAULT false
);

-- Tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_preparacao', 'pronto', 'entregue', 'cancelado')),
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'dinheiro' CHECK (forma_pagamento IN ('dinheiro', 'pix', 'credito')),
  crianca_nome TEXT,
  funcionario_id UUID REFERENCES public.funcionarios(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE
);

-- Tabela de itens do pedido
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- Tabela de anotações do dia
CREATE TABLE public.anotacoes_dia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  conteudo TEXT NOT NULL DEFAULT '',
  funcionario_id UUID REFERENCES public.funcionarios(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dívidas
CREATE TABLE public.dividas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas_clientes(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE,
  pago BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de caixa
CREATE TABLE public.caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES public.funcionarios(id),
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valor_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(10,2),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado'))
);

-- Self-references para produtos (order bump e upsell)
ALTER TABLE public.produtos ADD CONSTRAINT fk_order_bump FOREIGN KEY (eh_order_bump_para) REFERENCES public.produtos(id);
ALTER TABLE public.produtos ADD CONSTRAINT fk_upsell FOREIGN KEY (tem_upsell_para) REFERENCES public.produtos(id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_numeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sem auth - protegido pela senha do painel no frontend)
CREATE POLICY "acesso_publico_select" ON public.produtos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.produtos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.produtos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.produtos FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.funcionarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.funcionarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.funcionarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.funcionarios FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.criancas_clientes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.criancas_clientes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.criancas_clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.criancas_clientes FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.controle_numeros FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.controle_numeros FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.controle_numeros FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.controle_numeros FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.pedidos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.pedidos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.pedidos FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.itens_pedido FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.itens_pedido FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.itens_pedido FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.itens_pedido FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.anotacoes_dia FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.anotacoes_dia FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.anotacoes_dia FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.anotacoes_dia FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.dividas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.dividas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.dividas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.dividas FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "acesso_publico_select" ON public.caixa FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_all" ON public.caixa FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.caixa FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.caixa FOR DELETE TO anon, authenticated USING (true);

-- Dados de exemplo
INSERT INTO public.produtos (nome, descricao, preco, categoria, estoque_atual, ativo) VALUES
('Misto Quente', 'Pão de forma com queijo e presunto quentinho', 8.00, 'lanche', 30, true),
('Suco Natural', 'Suco de laranja natural feito na hora', 5.00, 'bebida', 25, true),
('Salgado Assado', 'Salgado assado crocante e saboroso', 6.00, 'lanche', 20, true),
('Bolo de Pote', 'Bolo de chocolate cremoso no potinho', 7.00, 'doce', 15, true),
('Água', 'Água mineral 500ml geladinha', 3.00, 'bebida', 50, true),
('Combo Lanche+Suco', 'Misto quente + suco natural com desconto', 12.00, 'lanche', 20, true);

INSERT INTO public.funcionarios (nome, ativo) VALUES
('Dona Maria', true),
('João', true);

INSERT INTO public.criancas_clientes (nome, saldo_credito, ativo) VALUES
('Ana Beatriz', 20.00, true),
('Pedro Lucas', 0.00, true),
('Mariana', 15.00, true);

INSERT INTO public.controle_numeros (data_atual, ultimo_numero, loja_aberta) VALUES
(CURRENT_DATE, 10, false);
