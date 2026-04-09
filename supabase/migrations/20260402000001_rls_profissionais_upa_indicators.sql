-- RLS policies for profissionais_saude
ALTER TABLE public.profissionais_saude ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profissionais_saude_select" ON public.profissionais_saude;
DROP POLICY IF EXISTS "profissionais_saude_insert" ON public.profissionais_saude;
DROP POLICY IF EXISTS "profissionais_saude_update" ON public.profissionais_saude;
DROP POLICY IF EXISTS "profissionais_saude_delete" ON public.profissionais_saude;

CREATE POLICY "profissionais_saude_select" ON public.profissionais_saude
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profissionais_saude_insert" ON public.profissionais_saude
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin','gestor','rh_dp','supervisor_operacional']::app_role[])
  );

CREATE POLICY "profissionais_saude_update" ON public.profissionais_saude
  FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin','gestor','rh_dp','supervisor_operacional']::app_role[])
  );

CREATE POLICY "profissionais_saude_delete" ON public.profissionais_saude
  FOR DELETE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin','gestor','rh_dp']::app_role[])
  );

-- RLS policies for upa_indicators
ALTER TABLE public.upa_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upa_indicators_select" ON public.upa_indicators;
DROP POLICY IF EXISTS "upa_indicators_insert" ON public.upa_indicators;
DROP POLICY IF EXISTS "upa_indicators_update" ON public.upa_indicators;

CREATE POLICY "upa_indicators_select" ON public.upa_indicators
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "upa_indicators_insert" ON public.upa_indicators
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin','gestor','medicos','coordenador_medico','nir','qualidade','nsp']::app_role[])
  );

CREATE POLICY "upa_indicators_update" ON public.upa_indicators
  FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin','gestor','medicos','coordenador_medico','nir','qualidade','nsp']::app_role[])
  );

-- RLS for agenda_items (if not already set)
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_items_select" ON public.agenda_items;
DROP POLICY IF EXISTS "agenda_items_insert" ON public.agenda_items;
DROP POLICY IF EXISTS "agenda_items_update" ON public.agenda_items;
DROP POLICY IF EXISTS "agenda_items_delete" ON public.agenda_items;

CREATE POLICY "agenda_items_select" ON public.agenda_items
  FOR SELECT TO authenticated
  USING (
    criado_por = auth.uid()
    OR id IN (SELECT agenda_item_id FROM public.agenda_destinatarios WHERE usuario_id = auth.uid())
  );

CREATE POLICY "agenda_items_insert" ON public.agenda_items
  FOR INSERT TO authenticated
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY "agenda_items_update" ON public.agenda_items
  FOR UPDATE TO authenticated
  USING (criado_por = auth.uid());

CREATE POLICY "agenda_items_delete" ON public.agenda_items
  FOR DELETE TO authenticated
  USING (criado_por = auth.uid());
