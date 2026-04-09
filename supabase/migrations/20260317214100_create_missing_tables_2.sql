-- Cria tabelas criadas manualmente no projeto original (ativos, manutencoes_preventivas, pedidos_compra)

-- 1. ativos (base para as demais)
CREATE TABLE IF NOT EXISTS public.ativos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                text NOT NULL,
  categoria           text NOT NULL DEFAULT 'equipamento',
  status              text NOT NULL DEFAULT 'ativo',
  criticidade         text NOT NULL DEFAULT 'baixa',
  setor_responsavel   text NOT NULL,
  setor_localizacao   text,
  fabricante          text,
  modelo              text,
  numero_serie        text,
  numero_patrimonio   text,
  descricao           text,
  observacoes         text,
  data_aquisicao      text,
  data_garantia_fim   text,
  valor_aquisicao     numeric,
  vida_util_meses     integer,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth select ativos" ON public.ativos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert ativos" ON public.ativos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update ativos" ON public.ativos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- 2. manutencoes_preventivas (depende de ativos)
CREATE TABLE IF NOT EXISTS public.manutencoes_preventivas (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo_id                   uuid NOT NULL REFERENCES public.ativos(id) ON DELETE CASCADE,
  titulo                     text NOT NULL,
  tipo                       text NOT NULL DEFAULT 'preventiva',
  tipo_manutencao            text NOT NULL DEFAULT 'interna',
  descricao                  text,
  setor                      text NOT NULL,
  responsavel_id             uuid REFERENCES auth.users(id),
  responsavel_nome           text NOT NULL,
  periodicidade_dias         integer NOT NULL DEFAULT 30,
  proxima_execucao           text NOT NULL,
  ultima_execucao            text,
  status                     text NOT NULL DEFAULT 'pendente',
  prioridade                 text NOT NULL DEFAULT 'media',
  custo_estimado             numeric,
  observacoes                text,
  requer_calibracao          boolean DEFAULT false,
  certificado_calibracao     text,
  data_vencimento_calibracao text,
  created_by                 uuid REFERENCES auth.users(id),
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manutencoes_preventivas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth select manutencoes_prev" ON public.manutencoes_preventivas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert manutencoes_prev" ON public.manutencoes_preventivas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update manutencoes_prev" ON public.manutencoes_preventivas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- 3. pedidos_compra (pode referenciar ativos)
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_nome                 text NOT NULL,
  item_descricao            text,
  quantidade_solicitada     integer NOT NULL DEFAULT 1,
  unidade_medida            text,
  justificativa             text NOT NULL,
  urgencia                  text NOT NULL DEFAULT 'normal',
  status                    text NOT NULL DEFAULT 'pendente',
  setor_solicitante         text NOT NULL,
  solicitante_id            uuid REFERENCES auth.users(id),
  solicitante_nome          text NOT NULL,
  ativo_id                  uuid REFERENCES public.ativos(id),
  produto_id                uuid,
  aprovado_por              uuid REFERENCES auth.users(id),
  aprovado_em               timestamptz,
  observacoes_gerencia      text,
  data_estimada_entrega     text,
  encaminhado_almoxarifado  boolean DEFAULT false,
  encaminhado_em            timestamptz,
  arquivo_url               text,
  arquivo_nome              text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth select pedidos_compra" ON public.pedidos_compra FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert pedidos_compra" ON public.pedidos_compra FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update pedidos_compra" ON public.pedidos_compra FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
