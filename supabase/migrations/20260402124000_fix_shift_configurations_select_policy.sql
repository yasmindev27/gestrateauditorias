-- Ensure Mapa de Leitos can read saved shift metadata consistently.

ALTER TABLE public.shift_configurations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.shift_configurations TO authenticated;

DROP POLICY IF EXISTS "Mapa Leitos roles can view shift_configurations" ON public.shift_configurations;
CREATE POLICY "Mapa Leitos roles can view shift_configurations"
ON public.shift_configurations
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'nir'::app_role, 'enfermagem'::app_role, 'assistencia_social'::app_role])
);
