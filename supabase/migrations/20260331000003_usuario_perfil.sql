-- ============================================================
-- Tabela usuario_perfil + dados existentes (export CSV)
-- ============================================================

-- 1. Criar tabela perfis_sistema (se não existir)
CREATE TABLE IF NOT EXISTS public.perfis_sistema (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  descricao   text,
  cor         text,
  icone       text,
  ativo       boolean DEFAULT true,
  is_master   boolean DEFAULT false,
  is_sistema  boolean DEFAULT false,
  ordem       integer,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  created_by  uuid
);

-- 2. Criar tabela usuario_perfil (se não existir)
CREATE TABLE IF NOT EXISTS public.usuario_perfil (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id   uuid REFERENCES public.perfis_sistema(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid
);

CREATE INDEX IF NOT EXISTS usuario_perfil_user_id_idx   ON public.usuario_perfil (user_id);
CREATE INDEX IF NOT EXISTS usuario_perfil_perfil_id_idx ON public.usuario_perfil (perfil_id);

-- RLS
ALTER TABLE public.usuario_perfil   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_sistema    ENABLE ROW LEVEL SECURITY;

-- Admin e gestor gerenciam; autenticados leem
DROP POLICY IF EXISTS "usuario_perfil_select" ON public.usuario_perfil;
CREATE POLICY "usuario_perfil_select" ON public.usuario_perfil FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "usuario_perfil_insert" ON public.usuario_perfil;
CREATE POLICY "usuario_perfil_insert" ON public.usuario_perfil FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','gestor','gerente_administrativo'))
);

DROP POLICY IF EXISTS "usuario_perfil_delete" ON public.usuario_perfil;
CREATE POLICY "usuario_perfil_delete" ON public.usuario_perfil FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','gestor'))
);

DROP POLICY IF EXISTS "perfis_sistema_select" ON public.perfis_sistema;
CREATE POLICY "perfis_sistema_select" ON public.perfis_sistema FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "perfis_sistema_manage" ON public.perfis_sistema;
CREATE POLICY "perfis_sistema_manage" ON public.perfis_sistema FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','gestor'))
);

-- 3. Inserir perfis_sistema referenciados no CSV (IDs fixos para manter integridade)
INSERT INTO public.perfis_sistema (id, nome, ativo, is_sistema, ordem)
VALUES
  ('68191179-fd9c-4a1f-8c95-c8049a3e7ba2', 'Admin',                    true, true,  1),
  ('62ac171f-2dfb-45c9-8ae2-7153f24dc8c7', 'Gestor',                   true, true,  2),
  ('7de45cfa-f13c-4ed1-9c19-12eab11b42cb', 'Recepção',                 true, true,  3),
  ('6a26b9c0-2668-4386-bb2a-86fd31e9e093', 'NIR',                      true, true,  4),
  ('707d517f-d965-420c-a567-66998a7e994d', 'Classificação de Risco',   true, true,  5),
  ('d9625195-c10f-4707-b6b8-adef1eae51a7', 'Faturamento',              true, true,  6),
  ('5891fc93-bd33-4260-8916-82ece1b29320', 'Qualidade',                true, true,  7),
  ('d6ae9d19-10b5-4ad2-9515-2be81ba14cf9', 'NSP',                      true, true,  8),
  ('b02da669-31cf-4af5-8069-77687f19b939', 'Enfermagem',               true, true,  9),
  ('01a994dc-fb71-4ee2-ac62-d483f380af71', 'Médicos',                  true, true, 10)
ON CONFLICT DO NOTHING;

-- 4. Reinserir dados do CSV (ignora linhas cujo user_id não existe em auth.users)
INSERT INTO public.usuario_perfil (id, user_id, perfil_id, created_at, created_by)
SELECT t.id, t.user_id, t.perfil_id, t.created_at, t.created_by
FROM (VALUES
  ('7d4c90b7-3f6b-403a-b52b-2b6d90523643'::uuid, '6989b738-0b67-4a5e-ad7b-9d29762fb7fa'::uuid, '68191179-fd9c-4a1f-8c95-c8049a3e7ba2'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('5b76da7a-e1ea-41fb-927c-e6bd816dae44'::uuid, '7fcbe64f-4c13-49f4-a701-d3cd2bc61875'::uuid, '62ac171f-2dfb-45c9-8ae2-7153f24dc8c7'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('5243f6cd-d426-41e6-be2e-222ea93b2032'::uuid, '357cd9be-9fee-4acc-9a8d-ef37b418462d'::uuid, '62ac171f-2dfb-45c9-8ae2-7153f24dc8c7'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('d203bed2-70d6-4227-b6ea-ae44f916000f'::uuid, '03fa7ffe-8f45-489e-b3f2-611b7dfd6a13'::uuid, '7de45cfa-f13c-4ed1-9c19-12eab11b42cb'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('bbeb0a06-91d8-45d5-b757-bcb96cbcbea3'::uuid, '2b274bcf-af76-4c68-8d35-b256f424f356'::uuid, '7de45cfa-f13c-4ed1-9c19-12eab11b42cb'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('dbf1e955-77f2-4027-b5e4-4a20a9a4acd6'::uuid, '7fcbe64f-4c13-49f4-a701-d3cd2bc61875'::uuid, '6a26b9c0-2668-4386-bb2a-86fd31e9e093'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('84814ebd-7b43-45dc-ad99-570219b522f9'::uuid, '357cd9be-9fee-4acc-9a8d-ef37b418462d'::uuid, '707d517f-d965-420c-a567-66998a7e994d'::uuid, '2026-02-04 12:43:08.856637+00'::timestamptz, NULL::uuid),
  ('f9158f61-5cb2-4b88-91f4-97dba840233b'::uuid, 'ef33219d-9dab-4d1e-9008-398ef0e6eeb1'::uuid, 'd9625195-c10f-4707-b6b8-adef1eae51a7'::uuid, '2026-02-19 14:36:26.501319+00'::timestamptz, NULL::uuid),
  ('b88cbf8f-28c1-4a19-a82a-dba22fc89f58'::uuid, '357cd9be-9fee-4acc-9a8d-ef37b418462d'::uuid, '68191179-fd9c-4a1f-8c95-c8049a3e7ba2'::uuid, '2026-02-27 11:02:56.061901+00'::timestamptz, NULL::uuid),
  ('451983fd-3eaa-4b25-9691-2176e304725c'::uuid, '4dc830b9-6699-49cb-aea2-e17974bf1595'::uuid, '62ac171f-2dfb-45c9-8ae2-7153f24dc8c7'::uuid, '2026-02-27 11:02:56.061901+00'::timestamptz, NULL::uuid),
  ('248b78eb-030a-4d17-85e1-7ab7b5d9fc85'::uuid, 'aaecf676-e022-4257-bca3-07a2ff5898ee'::uuid, '62ac171f-2dfb-45c9-8ae2-7153f24dc8c7'::uuid, '2026-02-27 11:02:56.061901+00'::timestamptz, NULL::uuid),
  ('7571389d-264f-48f8-ab97-4e8817d911ca'::uuid, '7b58df57-cf8d-40af-9664-6d431f7ff249'::uuid, '5891fc93-bd33-4260-8916-82ece1b29320'::uuid, '2026-02-27 11:05:29.670470+00'::timestamptz, NULL::uuid),
  ('11759202-2fa9-4866-8b49-87bca7e35c08'::uuid, '4dc830b9-6699-49cb-aea2-e17974bf1595'::uuid, 'd6ae9d19-10b5-4ad2-9515-2be81ba14cf9'::uuid, '2026-02-27 11:07:26.403825+00'::timestamptz, NULL::uuid),
  ('882f57e8-c0f7-4819-9559-970a7f2fa68a'::uuid, 'aaecf676-e022-4257-bca3-07a2ff5898ee'::uuid, 'b02da669-31cf-4af5-8069-77687f19b939'::uuid, '2026-02-27 11:07:26.403825+00'::timestamptz, NULL::uuid),
  ('7903639b-360c-4b5c-89a6-3bea81453b7e'::uuid, '4cfa4a4d-7979-4cce-bd5c-f5aa0667bbad'::uuid, '01a994dc-fb71-4ee2-ac62-d483f380af71'::uuid, '2026-03-24 16:25:27.733537+00'::timestamptz, NULL::uuid)
) AS t(id, user_id, perfil_id, created_at, created_by)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = t.user_id)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE '✅ usuario_perfil populada (usuários ausentes em auth.users foram ignorados).';
END $$;
