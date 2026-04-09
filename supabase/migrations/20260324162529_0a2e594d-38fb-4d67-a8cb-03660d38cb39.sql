
-- Vincular Renata Fernanda ao perfil Enfermagem (apenas se o usuário existir)
INSERT INTO public.usuario_perfil (user_id, perfil_id)
SELECT '4cfa4a4d-7979-4cce-bd5c-f5aa0667bbad', '01a994dc-fb71-4ee2-ac62-d483f380af71'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '4cfa4a4d-7979-4cce-bd5c-f5aa0667bbad'::uuid)
ON CONFLICT DO NOTHING;

-- Dar acesso ao módulo Restaurante para perfis Enfermagem e Coordenador de Enfermagem
INSERT INTO public.permissoes_perfil (perfil_id, modulo_id, pode_visualizar, pode_acessar, comportamento_sem_acesso)
SELECT t.perfil_id, t.modulo_id, t.pode_visualizar, t.pode_acessar, t.comportamento_sem_acesso
FROM (VALUES
  ('01a994dc-fb71-4ee2-ac62-d483f380af71'::uuid, 'e63ffa47-b331-41a6-ac7d-afa9b62e143a'::uuid, true, true, 'desabilitar'),
  ('d6ae9d19-10b5-4ad2-9515-2be81ba14cf9'::uuid, 'e63ffa47-b331-41a6-ac7d-afa9b62e143a'::uuid, true, true, 'desabilitar')
) AS t(perfil_id, modulo_id, pode_visualizar, pode_acessar, comportamento_sem_acesso)
WHERE EXISTS (SELECT 1 FROM public.perfis_sistema WHERE id = t.perfil_id)
  AND EXISTS (SELECT 1 FROM public.modulos_sistema WHERE id = t.modulo_id)
ON CONFLICT DO NOTHING;
