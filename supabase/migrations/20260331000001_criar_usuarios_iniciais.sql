-- ============================================================
-- Criação de Usuários Iniciais — UPA Nova Serrana
-- Senha padrão: UPANova@2026 (todos devem trocar no 1º login)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

DO $$
DECLARE
  v_senha_hash text := crypt('UPANova@2026', gen_salt('bf'));

  -- IDs dos usuários (fixos para referenciar depois)
  id_admin              uuid := gen_random_uuid();
  id_gestor             uuid := gen_random_uuid();
  id_gerente_adm        uuid := gen_random_uuid();
  id_recepcao           uuid := gen_random_uuid();
  id_classificacao      uuid := gen_random_uuid();
  id_nir                uuid := gen_random_uuid();
  id_faturamento        uuid := gen_random_uuid();
  id_enfermagem         uuid := gen_random_uuid();
  id_coord_enfermagem   uuid := gen_random_uuid();
  id_medicos            uuid := gen_random_uuid();
  id_coord_medico       uuid := gen_random_uuid();
  id_qualidade          uuid := gen_random_uuid();
  id_nsp                uuid := gen_random_uuid();
  id_rh_dp              uuid := gen_random_uuid();
  id_ti                 uuid := gen_random_uuid();
  id_manutencao         uuid := gen_random_uuid();
  id_eng_clinica        uuid := gen_random_uuid();
  id_laboratorio        uuid := gen_random_uuid();
  id_restaurante        uuid := gen_random_uuid();
  id_rouparia           uuid := gen_random_uuid();
  id_seguranca          uuid := gen_random_uuid();
  id_assistencia_social uuid := gen_random_uuid();
  id_farmaceutico       uuid := gen_random_uuid();
  id_supervisor_op      uuid := gen_random_uuid();

BEGIN

-- ============================================================
-- 1. Criar contas em auth.users
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  is_super_admin
)
VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000000', id_admin, 'authenticated', 'authenticated',
   'admin@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Administrador"}'::jsonb,
   now(), now(), '', '', false),

  -- Gestor
  ('00000000-0000-0000-0000-000000000000', id_gestor, 'authenticated', 'authenticated',
   'gestor@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Gestor UPA"}'::jsonb,
   now(), now(), '', '', false),

  -- Gerente Administrativo
  ('00000000-0000-0000-0000-000000000000', id_gerente_adm, 'authenticated', 'authenticated',
   'gerente.adm@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Gerente Administrativo"}'::jsonb,
   now(), now(), '', '', false),

  -- Recepção
  ('00000000-0000-0000-0000-000000000000', id_recepcao, 'authenticated', 'authenticated',
   'recepcao@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Recepção"}'::jsonb,
   now(), now(), '', '', false),

  -- Classificação (Enfermagem Triagem)
  ('00000000-0000-0000-0000-000000000000', id_classificacao, 'authenticated', 'authenticated',
   'classificacao@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Classificação de Risco"}'::jsonb,
   now(), now(), '', '', false),

  -- NIR
  ('00000000-0000-0000-0000-000000000000', id_nir, 'authenticated', 'authenticated',
   'nir@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Núcleo Interno de Regulação"}'::jsonb,
   now(), now(), '', '', false),

  -- Faturamento
  ('00000000-0000-0000-0000-000000000000', id_faturamento, 'authenticated', 'authenticated',
   'faturamento@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Faturamento"}'::jsonb,
   now(), now(), '', '', false),

  -- Enfermagem
  ('00000000-0000-0000-0000-000000000000', id_enfermagem, 'authenticated', 'authenticated',
   'enfermagem@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Enfermagem"}'::jsonb,
   now(), now(), '', '', false),

  -- Coordenador de Enfermagem
  ('00000000-0000-0000-0000-000000000000', id_coord_enfermagem, 'authenticated', 'authenticated',
   'coord.enfermagem@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Coordenador de Enfermagem"}'::jsonb,
   now(), now(), '', '', false),

  -- Médicos
  ('00000000-0000-0000-0000-000000000000', id_medicos, 'authenticated', 'authenticated',
   'medicos@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Equipe Médica"}'::jsonb,
   now(), now(), '', '', false),

  -- Coordenador Médico
  ('00000000-0000-0000-0000-000000000000', id_coord_medico, 'authenticated', 'authenticated',
   'coord.medico@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Coordenador Médico"}'::jsonb,
   now(), now(), '', '', false),

  -- Qualidade
  ('00000000-0000-0000-0000-000000000000', id_qualidade, 'authenticated', 'authenticated',
   'qualidade@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Gestão da Qualidade"}'::jsonb,
   now(), now(), '', '', false),

  -- NSP
  ('00000000-0000-0000-0000-000000000000', id_nsp, 'authenticated', 'authenticated',
   'nsp@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Núcleo de Segurança do Paciente"}'::jsonb,
   now(), now(), '', '', false),

  -- RH/DP
  ('00000000-0000-0000-0000-000000000000', id_rh_dp, 'authenticated', 'authenticated',
   'rh@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Recursos Humanos / DP"}'::jsonb,
   now(), now(), '', '', false),

  -- TI
  ('00000000-0000-0000-0000-000000000000', id_ti, 'authenticated', 'authenticated',
   'ti@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Tecnologia da Informação"}'::jsonb,
   now(), now(), '', '', false),

  -- Manutenção
  ('00000000-0000-0000-0000-000000000000', id_manutencao, 'authenticated', 'authenticated',
   'manutencao@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Manutenção"}'::jsonb,
   now(), now(), '', '', false),

  -- Engenharia Clínica
  ('00000000-0000-0000-0000-000000000000', id_eng_clinica, 'authenticated', 'authenticated',
   'engenharia.clinica@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Engenharia Clínica"}'::jsonb,
   now(), now(), '', '', false),

  -- Laboratório
  ('00000000-0000-0000-0000-000000000000', id_laboratorio, 'authenticated', 'authenticated',
   'laboratorio@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Laboratório"}'::jsonb,
   now(), now(), '', '', false),

  -- Restaurante
  ('00000000-0000-0000-0000-000000000000', id_restaurante, 'authenticated', 'authenticated',
   'restaurante@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Restaurante / Nutrição"}'::jsonb,
   now(), now(), '', '', false),

  -- Rouparia
  ('00000000-0000-0000-0000-000000000000', id_rouparia, 'authenticated', 'authenticated',
   'rouparia@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rouparia / Lavanderia"}'::jsonb,
   now(), now(), '', '', false),

  -- Segurança Patrimonial
  ('00000000-0000-0000-0000-000000000000', id_seguranca, 'authenticated', 'authenticated',
   'seguranca@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Segurança Patrimonial"}'::jsonb,
   now(), now(), '', '', false),

  -- Assistência Social
  ('00000000-0000-0000-0000-000000000000', id_assistencia_social, 'authenticated', 'authenticated',
   'assistencia.social@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Assistência Social"}'::jsonb,
   now(), now(), '', '', false),

  -- Farmacêutico RT
  ('00000000-0000-0000-0000-000000000000', id_farmaceutico, 'authenticated', 'authenticated',
   'farmacia@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Farmacêutico Responsável Técnico"}'::jsonb,
   now(), now(), '', '', false),

  -- Supervisor Operacional
  ('00000000-0000-0000-0000-000000000000', id_supervisor_op, 'authenticated', 'authenticated',
   'supervisor@upanovaserrana.com.br', v_senha_hash,
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Supervisor Operacional"}'::jsonb,
   now(), now(), '', '', false)

ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Criar identities (necessário para login funcionar)
-- ============================================================
INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
SELECT
  u.email,
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
  'email',
  now(), now(), now()
FROM auth.users u
WHERE u.email LIKE '%@upanovaserrana.com.br'
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================
-- 3. Criar perfis em public.profiles
-- ============================================================
INSERT INTO public.profiles (user_id, full_name, cargo, setor, matricula, deve_trocar_senha)
VALUES
  (id_admin,              'Administrador',                        'Administrador do Sistema',       'Gestão',                  'ADM001', true),
  (id_gestor,             'Gestor UPA',                           'Gestor',                         'Direção',                 'GST001', true),
  (id_gerente_adm,        'Gerente Administrativo',               'Gerente Administrativo',         'Administrativo',          'GRN001', true),
  (id_recepcao,           'Recepção',                             'Recepcionista',                  'Recepção',                'REC001', true),
  (id_classificacao,      'Classificação de Risco',               'Técnico de Enfermagem - Triagem','Classificação de Risco',  'CLA001', true),
  (id_nir,                'Núcleo Interno de Regulação',          'Regulador NIR',                  'NIR',                     'NIR001', true),
  (id_faturamento,        'Faturamento',                          'Analista de Faturamento',        'Faturamento',             'FAT001', true),
  (id_enfermagem,         'Enfermagem',                           'Enfermeiro(a)',                  'Enfermagem',              'ENF001', true),
  (id_coord_enfermagem,   'Coordenador de Enfermagem',            'Coordenador de Enfermagem',      'Enfermagem',              'COE001', true),
  (id_medicos,            'Equipe Médica',                        'Médico(a)',                      'Medicina',                'MED001', true),
  (id_coord_medico,       'Coordenador Médico',                   'Coordenador Médico',             'Medicina',                'COM001', true),
  (id_qualidade,          'Gestão da Qualidade',                  'Analista de Qualidade',          'Qualidade',               'QLD001', true),
  (id_nsp,                'Núcleo de Segurança do Paciente',      'Analista NSP',                   'NSP',                     'NSP001', true),
  (id_rh_dp,              'Recursos Humanos / DP',                'Analista de RH',                 'RH/DP',                   'RHD001', true),
  (id_ti,                 'Tecnologia da Informação',             'Analista de TI',                 'TI',                      'TI0001', true),
  (id_manutencao,         'Manutenção',                           'Técnico de Manutenção',          'Manutenção',              'MNT001', true),
  (id_eng_clinica,        'Engenharia Clínica',                   'Engenheiro Clínico',             'Engenharia Clínica',      'ENC001', true),
  (id_laboratorio,        'Laboratório',                          'Técnico de Laboratório',         'Laboratório',             'LAB001', true),
  (id_restaurante,        'Restaurante / Nutrição',               'Nutricionista',                  'Restaurante',             'RST001', true),
  (id_rouparia,           'Rouparia / Lavanderia',                'Responsável de Rouparia',        'Rouparia',                'ROP001', true),
  (id_seguranca,          'Segurança Patrimonial',                'Agente de Segurança',            'Segurança',               'SEG001', true),
  (id_assistencia_social, 'Assistência Social',                   'Assistente Social',              'Assistência Social',      'ASS001', true),
  (id_farmaceutico,       'Farmacêutico Responsável Técnico',     'Farmacêutico RT',                'Farmácia',                'FAR001', true),
  (id_supervisor_op,      'Supervisor Operacional',               'Supervisor Operacional',         'Operacional',             'SUP001', true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 4. Atribuir roles em public.user_roles
-- ============================================================
INSERT INTO public.user_roles (user_id, role)
VALUES
  (id_admin,              'admin'),
  (id_gestor,             'gestor'),
  (id_gerente_adm,        'gerente_administrativo'),
  (id_recepcao,           'recepcao'),
  (id_classificacao,      'classificacao'),
  (id_nir,                'nir'),
  (id_faturamento,        'faturamento'),
  (id_enfermagem,         'enfermagem'),
  (id_coord_enfermagem,   'coordenador_enfermagem'),
  (id_medicos,            'medicos'),
  (id_coord_medico,       'coordenador_medico'),
  (id_qualidade,          'qualidade'),
  (id_nsp,                'nsp'),
  (id_rh_dp,              'rh_dp'),
  (id_ti,                 'ti'),
  (id_manutencao,         'manutencao'),
  (id_eng_clinica,        'engenharia_clinica'),
  (id_laboratorio,        'laboratorio'),
  (id_restaurante,        'restaurante'),
  (id_rouparia,           'rouparia'),
  (id_seguranca,          'seguranca'),
  (id_assistencia_social, 'assistencia_social'),
  (id_farmaceutico,       'farmaceutico_rt'),
  (id_supervisor_op,      'supervisor_operacional')
ON CONFLICT (user_id, role) DO NOTHING;

RAISE NOTICE '✅ 24 usuários criados com sucesso. Senha padrão: UPANova@2026';
END $$;
