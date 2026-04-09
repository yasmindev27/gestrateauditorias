-- Permite que perfis do módulo Médicos gravem indicadores NSP em Entrada de Dados
-- Mantém controle por função (RLS) via has_any_role

-- NSP indicators
DROP POLICY IF EXISTS "Quality roles manage nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Auth insert nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Auth update nsp_indicators" ON public.nsp_indicators;
DROP POLICY IF EXISTS "Auth delete nsp_indicators" ON public.nsp_indicators;

CREATE POLICY "Clinical and quality roles manage nsp_indicators"
ON public.nsp_indicators
FOR ALL
TO authenticated
USING (
  has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'qualidade'::app_role,
      'nsp'::app_role,
      'gestor'::app_role,
      'medicos'::app_role,
      'coordenador_medico'::app_role
    ]
  )
)
WITH CHECK (
  has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'qualidade'::app_role,
      'nsp'::app_role,
      'gestor'::app_role,
      'medicos'::app_role,
      'coordenador_medico'::app_role
    ]
  )
);

-- NSP action plans (mesma regra para evitar bloqueio na aba de gestão)
DROP POLICY IF EXISTS "Quality roles manage nsp_action_plans" ON public.nsp_action_plans;

CREATE POLICY "Clinical and quality roles manage nsp_action_plans"
ON public.nsp_action_plans
FOR ALL
TO authenticated
USING (
  has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'qualidade'::app_role,
      'nsp'::app_role,
      'gestor'::app_role,
      'medicos'::app_role,
      'coordenador_medico'::app_role
    ]
  )
)
WITH CHECK (
  has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'qualidade'::app_role,
      'nsp'::app_role,
      'gestor'::app_role,
      'medicos'::app_role,
      'coordenador_medico'::app_role
    ]
  )
);
