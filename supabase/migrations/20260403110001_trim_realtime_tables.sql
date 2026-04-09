-- Remove tabelas de baixo tráfego da publicação Realtime do Supabase.
-- Cada tabela na publicação consome CPU/RAM do processo de replicação,
-- mesmo que ninguém esteja escutando no momento.
--
-- Tabelas MANTIDAS no Realtime (tráfego real-time justificado):
--   bed_records, enfermagem_escalas, chamados, incidentes_nsp,
--   alertas_seguranca, agenda_items, chat_mensagens, enfermagem_trocas,
--   refeicoes_registros, prontuarios, escalas_medicos
--
-- Tabelas REMOVIDAS (atualizações em lote ou raramente em tempo real):
--   daily_statistics  → atualizada 1x/dia em batch, sem uso de listener real-time
--   auditorias_qualidade → modificada manualmente, sem listener ativo
--   profiles          → mudanças são raras; o onAuthStateChange já cobre troca de sessão

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='daily_statistics') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.daily_statistics;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='auditorias_qualidade') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.auditorias_qualidade;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='profiles') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END $$;
