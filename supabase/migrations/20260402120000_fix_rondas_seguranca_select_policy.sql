-- Ensure authenticated users can read rounds in Seguranca do Trabalho.
-- This protects against environments where the original SELECT policy was not applied.

ALTER TABLE public.rondas_seguranca ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.rondas_seguranca TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view rondas seg trabalho" ON public.rondas_seguranca;
CREATE POLICY "Authenticated users can view rondas seg trabalho"
ON public.rondas_seguranca
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
