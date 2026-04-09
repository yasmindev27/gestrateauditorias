-- Índices de performance para as tabelas mais consultadas.
-- Criados com IF NOT EXISTS para ser idempotente.

-- saida_prontuarios: principal query do EntregaProntuariosDialog
-- filtro: is_folha_avulsa = false AND status != 'concluido', ordenado por created_at
CREATE INDEX IF NOT EXISTS idx_saida_prontuarios_status_created
  ON public.saida_prontuarios(status, created_at DESC)
  WHERE is_folha_avulsa = false;

-- saida_prontuarios: busca por nome do paciente (ilike)
CREATE INDEX IF NOT EXISTS idx_saida_prontuarios_paciente_nome
  ON public.saida_prontuarios(paciente_nome text_pattern_ops)
  WHERE is_folha_avulsa = false;

-- alertas_seguranca: GlobalSecurityAlarm faz count por status='pendente' constantemente
CREATE INDEX IF NOT EXISTS idx_alertas_seguranca_status
  ON public.alertas_seguranca(status)
  WHERE status = 'pendente';

-- user_roles: useUserRole busca por user_id em até 45 componentes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

-- profiles: buscado por user_id em vários pontos (nome, cargo, setor)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles(user_id);

-- profiles: busca por nome (ilike) no autocomplete de colaboradores
CREATE INDEX IF NOT EXISTS idx_profiles_full_name
  ON public.profiles(full_name text_pattern_ops);

-- usuario_perfil: useModules busca por user_id a cada load de permissões
CREATE INDEX IF NOT EXISTS idx_usuario_perfil_user_id
  ON public.usuario_perfil(user_id);

-- permissoes_perfil: useModules busca por perfil_id
CREATE INDEX IF NOT EXISTS idx_permissoes_perfil_perfil_id
  ON public.permissoes_perfil(perfil_id);

-- passagem_plantao_pendencias: PendenciasAlertSystem filtra por destinatario_id + status
CREATE INDEX IF NOT EXISTS idx_plantao_pendencias_destinatario_status
  ON public.passagem_plantao_pendencias(destinatario_id, status)
  WHERE status = 'pendente';

-- notificacoes_pendencias: filtra por destinatario_id + respondida
CREATE INDEX IF NOT EXISTS idx_notificacoes_pendencias_dest_respondida
  ON public.notificacoes_pendencias(destinatario_id, respondida)
  WHERE respondida = false;

-- entregas_prontuarios: ordenadas por created_at
CREATE INDEX IF NOT EXISTS idx_entregas_prontuarios_created_at
  ON public.entregas_prontuarios(created_at DESC);

-- logs_acesso: insert-heavy, index em user_id para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_logs_acesso_user_id
  ON public.logs_acesso(user_id);
