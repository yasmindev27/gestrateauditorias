-- Permite salvamento de indicadores UPA para perfis da Enfermagem
-- (caso reportado: coordenador_enfermagem sem permissão de INSERT/UPDATE)

ALTER TABLE public.upa_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upa_indicators_insert" ON public.upa_indicators;
DROP POLICY IF EXISTS "upa_indicators_update" ON public.upa_indicators;

CREATE POLICY "upa_indicators_insert" ON public.upa_indicators
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'medicos',
        'coordenador_medico',
        'nir',
        'qualidade',
        'nsp',
        'enfermagem',
        'coordenador_enfermagem'
      ]::app_role[]
    )
  );

CREATE POLICY "upa_indicators_update" ON public.upa_indicators
  FOR UPDATE TO authenticated
  USING (
    has_any_role(
      auth.uid(),
      ARRAY[
        'admin',
        'gestor',
        'medicos',
        'coordenador_medico',
        'nir',
        'qualidade',
        'nsp',
        'enfermagem',
        'coordenador_enfermagem'
      ]::app_role[]
    )
  );
