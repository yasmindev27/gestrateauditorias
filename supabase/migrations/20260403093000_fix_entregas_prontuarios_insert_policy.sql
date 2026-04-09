-- Corrige policy de INSERT para registro de entrega de prontuarios.
-- Problema observado: usuarios da recepcao recebendo erro de RLS ao inserir em entregas_prontuarios.
-- Estrategia: ALTER direto para reduzir tempo de execucao no SQL Editor.

SET lock_timeout = '5s';

ALTER POLICY "Authorized roles can insert entregas"
ON public.entregas_prontuarios
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND entregador_id = auth.uid()
  AND public.has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'gestor'::app_role,
      'recepcao'::app_role,
      'classificacao'::app_role,
      'nir'::app_role,
      'faturamento'::app_role,
      'enfermagem'::app_role,
      'coordenador_enfermagem'::app_role,
      'supervisor_operacional'::app_role
    ]
  )
);

ALTER POLICY "Authorized roles can insert entrega itens"
ON public.entregas_prontuarios_itens
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::app_role,
      'gestor'::app_role,
      'recepcao'::app_role,
      'classificacao'::app_role,
      'nir'::app_role,
      'faturamento'::app_role,
      'enfermagem'::app_role,
      'coordenador_enfermagem'::app_role,
      'supervisor_operacional'::app_role
    ]
  )
  AND EXISTS (
    SELECT 1
    FROM public.entregas_prontuarios ep
    WHERE ep.id = entrega_id
      AND (
        ep.entregador_id = auth.uid()
        OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
      )
  )
);

RESET lock_timeout;
