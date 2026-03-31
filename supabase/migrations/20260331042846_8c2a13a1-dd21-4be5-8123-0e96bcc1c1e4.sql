
-- Adicionar crianca_id à tabela pedidos (referencia criancas_clientes)
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS crianca_id uuid REFERENCES public.criancas_clientes(id) ON DELETE SET NULL;

-- Habilitar realtime para pedidos (caso não esteja)
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
