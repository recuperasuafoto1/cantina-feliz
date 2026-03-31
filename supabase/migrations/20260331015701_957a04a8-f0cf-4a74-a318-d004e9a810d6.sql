
-- Tabela de configurações do sistema (singleton)
CREATE TABLE public.configuracoes_sistema (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  css_personalizado text DEFAULT '',
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_select" ON public.configuracoes_sistema FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_update" ON public.configuracoes_sistema FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_insert" ON public.configuracoes_sistema FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.configuracoes_sistema (id, css_personalizado) VALUES (1, '');

-- Tabela de movimentações de crédito
CREATE TABLE public.movimentacoes_credito (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id uuid REFERENCES public.criancas_clientes(id) ON DELETE CASCADE NOT NULL,
  valor numeric NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao text,
  data timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.movimentacoes_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_select" ON public.movimentacoes_credito FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "acesso_publico_insert" ON public.movimentacoes_credito FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acesso_publico_update" ON public.movimentacoes_credito FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_delete" ON public.movimentacoes_credito FOR DELETE TO anon, authenticated USING (true);
