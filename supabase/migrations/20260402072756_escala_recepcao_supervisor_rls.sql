
-- Allow recepcao and supervisor_operacional to manage schedules (escalas)
-- They need access to create/edit reception and operational schedules

DROP POLICY IF EXISTS "Admin/gestor can manage schedules" ON public.escalas_tec_enfermagem;
CREATE POLICY "Admin/gestor/recepcao/supervisor can manage schedules"
ON public.escalas_tec_enfermagem FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]));

DROP POLICY IF EXISTS "Admin/gestor can manage prof" ON public.escala_tec_enf_profissionais;
CREATE POLICY "Admin/gestor/recepcao/supervisor can manage prof"
ON public.escala_tec_enf_profissionais FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]));

DROP POLICY IF EXISTS "Admin/gestor can manage dias" ON public.escala_tec_enf_dias;
CREATE POLICY "Admin/gestor/recepcao/supervisor can manage dias"
ON public.escala_tec_enf_dias FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor','enfermagem','recepcao','supervisor_operacional','coordenador_enfermagem']::app_role[]));
