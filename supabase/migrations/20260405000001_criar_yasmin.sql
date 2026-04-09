-- Criar conta da Yasmin Silva (administradora do sistema)
DO $$
DECLARE
  v_id   uuid := gen_random_uuid();
  v_hash text := crypt('UPANova@2026', gen_salt('bf'));
BEGIN
  -- Só cria se ainda não existir
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'yasminsilva18908@outlook.com') THEN

    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated', 'authenticated',
      'yasminsilva18908@outlook.com',
      v_hash,
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"full_name":"Yasmin Silva"}'::jsonb,
      now(), now(), '', '', false
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      'yasminsilva18908@outlook.com',
      v_id,
      json_build_object('sub', v_id::text, 'email', 'yasminsilva18908@outlook.com')::jsonb,
      'email',
      now(), now(), now()
    );

    SELECT id INTO v_id FROM auth.users WHERE email = 'yasminsilva18908@outlook.com';
  ELSE
    SELECT id INTO v_id FROM auth.users WHERE email = 'yasminsilva18908@outlook.com';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, cargo, setor, matricula, deve_trocar_senha)
  VALUES (v_id, 'Yasmin Silva', 'Administradora / Gestora do Sistema', 'Gestão Estratégica', 'YAS001', false)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name         = 'Yasmin Silva',
        cargo             = 'Administradora / Gestora do Sistema',
        setor             = 'Gestão Estratégica',
        matricula         = 'YAS001',
        deve_trocar_senha = false,
        updated_at        = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_id, 'admin')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Yasmin configurada com id: %', v_id;
END $$;
