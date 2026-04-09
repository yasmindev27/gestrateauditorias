-- Garante visibilidade e edicao dos Indicadores de Internacao no modulo Medicos
-- (dados ja existentes no banco estavam ocultos por RLS para papel medicos/coordenador_medico)

ALTER TABLE public.nsp_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsp_action_plans ENABLE ROW LEVEL SECURITY;

-- Limpa politicas antigas com nomes historicos diversos
DROP POLICY IF EXISTS "nsp_indicators_select" ON public.nsp_indicators;
DROP POLICY IF EXISTS "nsp_indicators_insert" ON public.nsp_indicators;
DROP POLICY IF EXISTS "nsp_indicators_update" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Quality roles manage nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Authenticated users can view nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Authenticated users can insert nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Authenticated users can update nsp_indicators" ON public.nsp_indicators;

CREATE POLICY "nsp_indicators_select" ON public.nsp_indicators
  FOR SELECT TO authenticated
  USING (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );

CREATE POLICY "nsp_indicators_insert" ON public.nsp_indicators
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );

CREATE POLICY "nsp_indicators_update" ON public.nsp_indicators
  FOR UPDATE TO authenticated
  USING (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );

DROP POLICY IF EXISTS "nsp_action_plans_select" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "nsp_action_plans_insert" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "nsp_action_plans_update" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "Quality roles manage nsp_action_plans" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "Authenticated users can view nsp_action_plans" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "Authenticated users can insert nsp_action_plans" ON public.nsp_action_plans;
DROP POLICY IF EXISTS "Authenticated users can update nsp_action_plans" ON public.nsp_action_plans;

CREATE POLICY "nsp_action_plans_select" ON public.nsp_action_plans
  FOR SELECT TO authenticated
  USING (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );

CREATE POLICY "nsp_action_plans_insert" ON public.nsp_action_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );

CREATE POLICY "nsp_action_plans_update" ON public.nsp_action_plans
  FOR UPDATE TO authenticated
  USING (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'qualidade',
        'nsp',
        'medicos',
        'coordenador_medico'
      ]::app_role[]
    )
  );
