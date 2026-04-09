-- Cria tabelas que foram criadas manualmente no projeto original
-- e não estavam em nenhuma migration anterior.

-- auditoria_temporalidade
CREATE TABLE IF NOT EXISTS public.auditoria_temporalidade (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo      text NOT NULL,
  setor       text NOT NULL,
  descricao   text NOT NULL,
  data_fato   text NOT NULL,
  data_registro text NOT NULL,
  delay_horas numeric,
  limite_horas numeric NOT NULL DEFAULT 24,
  registro_id uuid,
  justificado boolean DEFAULT false,
  justificativa_id uuid,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_temporalidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth select temporalidade"
  ON public.auditoria_temporalidade FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert temporalidade"
  ON public.auditoria_temporalidade FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- justificativas_atraso
CREATE TABLE IF NOT EXISTS public.justificativas_atraso (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id         uuid NOT NULL REFERENCES public.auditoria_temporalidade(id) ON DELETE CASCADE,
  responsavel_id       uuid REFERENCES auth.users(id),
  responsavel_nome     text NOT NULL,
  motivo               text NOT NULL,
  acao_corretiva       text NOT NULL,
  prazo_correcao       text,
  status               text NOT NULL DEFAULT 'pendente',
  aprovado_por         uuid REFERENCES auth.users(id),
  aprovado_por_nome    text,
  aprovado_em          timestamptz,
  observacao_gerencia  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.justificativas_atraso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth select justificativas"
  ON public.justificativas_atraso FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert justificativas"
  ON public.justificativas_atraso FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth update justificativas"
  ON public.justificativas_atraso FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);
