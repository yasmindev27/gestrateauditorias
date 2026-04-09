-- Contingência: garante leitura dos indicadores NSP para usuários autenticados.
-- Escrita continua controlada pelas policies de role-specific.

ALTER TABLE public.nsp_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsp_action_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nsp_indicators_select" ON public.nsp_indicators;
CREATE POLICY "nsp_indicators_select"
ON public.nsp_indicators
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "nsp_action_plans_select" ON public.nsp_action_plans;
CREATE POLICY "nsp_action_plans_select"
ON public.nsp_action_plans
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');
