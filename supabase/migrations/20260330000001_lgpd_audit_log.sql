-- ============================================================
-- LGPD/CFM Compliance: Sistema de Auditoria em Nível de Banco
-- Registra automaticamente INSERT, UPDATE e DELETE nas tabelas
-- sensíveis, capturando estado anterior e posterior.
-- Nenhum usuário (inclusive admin) pode deletar registros.
-- ============================================================

-- 1. Tabela de audit_log imutável
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela        text        NOT NULL,
  operacao      text        NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id   text,                        -- PK do registro afetado
  dados_antes   jsonb,                       -- Estado antes (UPDATE/DELETE)
  dados_depois  jsonb,                       -- Estado depois (INSERT/UPDATE)
  usuario_id    uuid,                        -- auth.uid() no momento da operação
  usuario_email text,                        -- email para legibilidade
  ip_address    inet,                        -- endereço IP (quando disponível)
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para queries rápidas no painel de auditoria
CREATE INDEX IF NOT EXISTS audit_log_tabela_idx      ON public.audit_log (tabela);
CREATE INDEX IF NOT EXISTS audit_log_usuario_idx     ON public.audit_log (usuario_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx  ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_operacao_idx    ON public.audit_log (operacao);
CREATE INDEX IF NOT EXISTS audit_log_registro_id_idx ON public.audit_log (registro_id);

-- 2. RLS: ninguém pode apagar ou editar logs (imutabilidade LGPD)
-- ============================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admin e gestor podem LER
CREATE POLICY "audit_log_select"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'gestor', 'gerente_administrativo')
    )
  );

-- Sistema (via trigger/service_role) pode INSERIR
CREATE POLICY "audit_log_insert"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- DELETE e UPDATE bloqueados para todos (imutabilidade)
-- Nenhuma policy de DELETE/UPDATE = bloqueio total

-- 3. Função genérica de trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id    uuid;
  v_usuario_email text;
  v_registro_id   text;
  v_dados_antes   jsonb;
  v_dados_depois  jsonb;
BEGIN
  -- Captura usuário autenticado (pode ser NULL em operações de sistema)
  BEGIN
    v_usuario_id    := auth.uid();
    v_usuario_email := (SELECT email FROM auth.users WHERE id = v_usuario_id LIMIT 1);
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id    := NULL;
    v_usuario_email := NULL;
  END;

  -- Captura o id do registro afetado (assume coluna 'id')
  IF TG_OP = 'DELETE' THEN
    v_dados_antes  := to_jsonb(OLD);
    v_dados_depois := NULL;
    BEGIN v_registro_id := OLD.id::text; EXCEPTION WHEN OTHERS THEN v_registro_id := NULL; END;
  ELSIF TG_OP = 'INSERT' THEN
    v_dados_antes  := NULL;
    v_dados_depois := to_jsonb(NEW);
    BEGIN v_registro_id := NEW.id::text; EXCEPTION WHEN OTHERS THEN v_registro_id := NULL; END;
  ELSE -- UPDATE
    v_dados_antes  := to_jsonb(OLD);
    v_dados_depois := to_jsonb(NEW);
    BEGIN v_registro_id := NEW.id::text; EXCEPTION WHEN OTHERS THEN v_registro_id := NULL; END;
  END IF;

  INSERT INTO public.audit_log (
    tabela, operacao, registro_id,
    dados_antes, dados_depois,
    usuario_id, usuario_email
  ) VALUES (
    TG_TABLE_NAME, TG_OP, v_registro_id,
    v_dados_antes, v_dados_depois,
    v_usuario_id, v_usuario_email
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Aplicar triggers nas tabelas sensíveis
-- ============================================================

DO $$ BEGIN
  -- Prontuários de saída
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='saida_prontuarios') THEN
    DROP TRIGGER IF EXISTS trg_audit_saida_prontuarios ON public.saida_prontuarios;
    CREATE TRIGGER trg_audit_saida_prontuarios
      AFTER INSERT OR UPDATE OR DELETE ON public.saida_prontuarios
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Avaliações de prontuários
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='avaliacoes_prontuarios') THEN
    DROP TRIGGER IF EXISTS trg_audit_avaliacoes_prontuarios ON public.avaliacoes_prontuarios;
    CREATE TRIGGER trg_audit_avaliacoes_prontuarios
      AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes_prontuarios
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Incidentes NSP
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidentes_nsp') THEN
    DROP TRIGGER IF EXISTS trg_audit_incidentes_nsp ON public.incidentes_nsp;
    CREATE TRIGGER trg_audit_incidentes_nsp
      AFTER INSERT OR UPDATE OR DELETE ON public.incidentes_nsp
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Ações de incidentes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='acoes_incidentes') THEN
    DROP TRIGGER IF EXISTS trg_audit_acoes_incidentes ON public.acoes_incidentes;
    CREATE TRIGGER trg_audit_acoes_incidentes
      AFTER INSERT OR UPDATE OR DELETE ON public.acoes_incidentes
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- User roles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles') THEN
    DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
    CREATE TRIGGER trg_audit_user_roles
      AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
    CREATE TRIGGER trg_audit_profiles
      AFTER INSERT OR UPDATE OR DELETE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Registros de ponto
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='registros_ponto') THEN
    DROP TRIGGER IF EXISTS trg_audit_registros_ponto ON public.registros_ponto;
    CREATE TRIGGER trg_audit_registros_ponto
      AFTER INSERT OR UPDATE OR DELETE ON public.registros_ponto
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- ASOs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='asos_seguranca') THEN
    DROP TRIGGER IF EXISTS trg_audit_asos_seguranca ON public.asos_seguranca;
    CREATE TRIGGER trg_audit_asos_seguranca
      AFTER INSERT OR UPDATE OR DELETE ON public.asos_seguranca
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;

  -- Auditorias de qualidade
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='auditorias_qualidade') THEN
    DROP TRIGGER IF EXISTS trg_audit_auditorias_qualidade ON public.auditorias_qualidade;
    CREATE TRIGGER trg_audit_auditorias_qualidade
      AFTER INSERT OR UPDATE OR DELETE ON public.auditorias_qualidade
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
  END IF;
END $$;

-- 5. Política de retenção: view para registros com mais de 20 anos
--    (CFM exige guarda mínima de 20 anos para adultos)
-- ============================================================
CREATE OR REPLACE VIEW public.audit_log_retencao_vencida AS
  SELECT *
  FROM public.audit_log
  WHERE created_at < now() - INTERVAL '20 years';

COMMENT ON TABLE public.audit_log IS
  'Tabela de auditoria imutável — LGPD Art. 37 + CFM Res. 1821/2007. '
  'Registra automaticamente todas as alterações em dados sensíveis. '
  'Retenção mínima: 20 anos. Nenhum registro pode ser apagado.';
