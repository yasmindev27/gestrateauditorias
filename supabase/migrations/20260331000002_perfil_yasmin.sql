-- ============================================================
-- Perfil e role admin para Yasmin (conta já existente)
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Busca o user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'yasminsilva18908@outlook.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário yasminsilva18908@outlook.com não encontrado em auth.users — pulando.';
    RETURN;
  END IF;

  -- Cria ou atualiza perfil
  INSERT INTO public.profiles (user_id, full_name, cargo, setor, matricula, deve_trocar_senha)
  VALUES (v_user_id, 'Yasmin Silva', 'Administradora / Gestora do Sistema', 'Gestão Estratégica', 'YAS001', false)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name          = 'Yasmin Silva',
        cargo              = 'Administradora / Gestora do Sistema',
        setor              = 'Gestão Estratégica',
        matricula          = 'YAS001',
        deve_trocar_senha  = false,
        updated_at         = now();

  -- Garante role admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ Perfil da Yasmin (%) configurado com sucesso.', v_user_id;
END $$;
