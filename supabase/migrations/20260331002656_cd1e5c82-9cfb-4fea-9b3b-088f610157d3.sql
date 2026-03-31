
-- Função RPC para gerar número de pedido atomicamente
CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  numero integer;
  hoje date := CURRENT_DATE;
BEGIN
  -- Lock e atualiza atomicamente
  UPDATE controle_numeros
  SET ultimo_numero = CASE
    WHEN data_atual != hoje THEN 11
    ELSE LEAST(ultimo_numero + 1, 1000)
  END,
  data_atual = hoje
  WHERE id = (SELECT id FROM controle_numeros LIMIT 1)
  RETURNING ultimo_numero INTO numero;

  -- Se não existe registro, cria
  IF numero IS NULL THEN
    INSERT INTO controle_numeros (data_atual, ultimo_numero, loja_aberta)
    VALUES (hoje, 11, true)
    RETURNING ultimo_numero INTO numero;
  END IF;

  RETURN numero;
END;
$$;
