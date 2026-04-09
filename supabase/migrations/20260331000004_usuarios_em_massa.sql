-- ============================================================
-- Criação em massa de usuários — UPA Nova Serrana
-- Senha padrão: UPANova@2026
-- Email: {matricula}@interno.local  (ou email direto quando matricula é email)
-- Yasmin Silva Fernandes omitida (conta já existente)
-- ============================================================

DO $$
DECLARE
  v_hash text := crypt('UPANova@2026', gen_salt('bf'));
  v_id   uuid;
  r      record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    -- email, full_name, cargo, setor, matricula, role_name, deve_trocar_senha
    ('bruce@interno.local',       'BRUCE LEE D ANGELYS SOUSA',                    'Gerente Administrativo',               'Administração',                        'bruce',           'gerente_administrativo', false),
    ('102502@interno.local',      'ADAM JOSE DE ANDRADE',                         'ENFERMEIRO (A)',                        'Enfermagem',                           '102502',          'enfermagem',             true),
    ('104535@interno.local',      'ADRIANA JOELMA DE FREITAS CUNHA',              'RECEPCIONISTA',                        'Recepção',                             '104535',          'recepcao',               false),
    ('103289@interno.local',      'ALDICE PAULA DA COSTA',                        'AUXILIAR DE SUPRIMENTOS',              'Suprimentos',                          '103289',          'funcionario',            true),
    ('103616@interno.local',      'ALESSANDRA ALVES DE SOUZA',                    'TECNICO ENFERMAGEM',                   'Enfermagem',                           '103616',          'enfermagem',             true),
    ('102488@interno.local',      'ALYNE PEREIRA COSTA',                          'ASSISTENTE SOCIAL',                    'Serviço Social',                       '102488',          'assistencia_social',     false),
    ('4000551@interno.local',     'AMANDA ROSE SILVA',                            'Enfermeiro',                           'Enfermagem',                           '4000551',         'enfermagem',             false),
    ('67547@interno.local',       'ANA CLAUDIA ESTEVES COSTA',                    'Médico',                               'Médicos',                              '67547',           'medicos',                false),
    ('103065@interno.local',      'ANA LUCIA DE JESUS PAIXÃO',                    'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '103065',          'funcionario',            true),
    ('102615@interno.local',      'ANA PAULA DA SILVA',                           'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102615',          'enfermagem',             true),
    ('102546@interno.local',      'ANA PAULA DE CAMPOS SANTOS',                   'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102546',          'enfermagem',             true),
    ('102620@interno.local',      'ANDRESSA DA SILVA RIBEIRO AMARAL',             'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102620',          'enfermagem',             true),
    ('102485@interno.local',      'ANNA CAROLINA MARTINS ROCHA',                  'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102485',          'enfermagem',             true),
    ('1900165@interno.local',     'BELKISS CANCADO DE AQUINO',                    'Enfermeiro',                           'Enfermagem',                           '1900165',         'enfermagem',             false),
    ('enfblendon@gmail.com',              'BLENDON RODRIGUES PEREIRA',                    'Gestor NIR',                           'NIR',                                  'enfblendon@gmail.com', 'nir',            false),
    ('103672@interno.local',      'BRICIA DA SILVA SANTOS',                       'TECNICO ENFERMAGEM',                   'Enfermagem',                           '103672',          'enfermagem',             true),
    ('102474@interno.local',      'BRUNO EVERTON SILVA DOS REIS',                 'CONDUTOR DE AMBULÂNCIA',               'Transporte',                           '102474',          'funcionario',            false),
    ('103267@interno.local',      'BRUNO HENRIQUE RIBEIRO DE OLIVEIRA',           'ENFERMEIRO (A)',                        'Enfermagem',                           '103267',          'enfermagem',             true),
    ('1900244@interno.local',     'Camilla Thaysa de Mesquita',                   'Qualidade',                            'Qualidade/NSP',                        '1900244',         'qualidade',              false),
    ('102499@interno.local',      'CAMILLA THAYSA DE MESQUITA',                   'ENFERMEIRO (A)',                        'Enfermagem',                           '102499',          'enfermagem',             true),
    ('103419@interno.local',      'CARLIANE ALVES ANTUNES',                       'Farmacêutico',                         'Farmácia',                             '103419',          'farmaceutico_rt',        true),
    ('103986@interno.local',      'CAROLYNNA SAYDEL DA SILVA BIGAO',              'Auxiliar de Ouvidoria',                'Ouvidoria',                            '103986',          'funcionario',            false),
    ('102519@interno.local',      'CLAUDIA BATISTA DA SILVA',                     'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102519',          'enfermagem',             true),
    ('102492@interno.local',      'CLEUNICE FERREIRA DOS SANTOS',                 'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102492',          'funcionario',            true),
    ('102512@interno.local',      'CRISTIANE GOMES DE SOUZA',                     'AUXILIAR ADMINISTRATIVO',              'Administrativo',                       '102512',          'funcionario',            false),
    ('102610@interno.local',      'CRISTINA ANGELINA DA SILVA',                   'FARMACEUTICO (A) RT',                  'Farmácia',                             '102610',          'farmaceutico_rt',        true),
    ('102483@interno.local',      'CRISTINA DANTAS GONÇALVES',                    'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102483',          'enfermagem',             true),
    ('290481@interno.local',      'DAIANE FERNANDES ESTEVES',                     'Auxiliar Administrativo',              'Recursos Humanos/Departamento Pessoal','290481',          'rh_dp',                  false),
    ('103561@interno.local',      'DANIELA ROSA SILVEIRA VENTURA',                'TEC. DE SEGURANCA DO TRABALHO',        'Segurança do Trabalho',                '103561',          'funcionario',            false),
    ('102552@interno.local',      'DANILO BOMFIM DA SILVA',                       'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102552',          'funcionario',            true),
    ('103157@interno.local',      'DANUBIA CRISTINA SILVA',                       'TECNICO ENFERMAGEM',                   'Enfermagem',                           '103157',          'enfermagem',             true),
    ('102473@interno.local',      'DANUBIA DE OLIVEIRA MARINS',                   'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102473',          'funcionario',            true),
    ('102548@interno.local',      'DEBORA CRISTINA VILELA TELES',                 'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102548',          'funcionario',            true),
    ('3900173@interno.local',     'DEIVISON OLIVEIRA DOS SANTOS',                 'Técnico de Enfermagem',                'Enfermagem',                           '3900173',         'enfermagem',             false),
    ('104437@interno.local',      'DENILZA CORDEIRO GANDRA',                      'ENFERMEIRO (A)',                        'Enfermagem',                           '104437',          'enfermagem',             true),
    ('102563@interno.local',      'DENISE FELIX NASCIMENTO SILVA',                'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102563',          'enfermagem',             true),
    ('102509@interno.local',      'DRIKA MAGALHAES BARBOSA',                      'ASSISTENTE DE RECURSOS HUMANOS',       'RH/DP',                                '102509',          'rh_dp',                  false),
    ('103142@interno.local',      'EDUARDO SOUZA DE OLIVEIRA',                    'AUXILIAR DE SUPRIMENTOS',              'Suprimentos',                          '103142',          'funcionario',            true),
    ('103265@interno.local',      'ELISA MARIA DA SILVA',                         'Enfermeiro',                           'Enfermagem',                           '103265',          'enfermagem',             false),
    ('104082@interno.local',      'EMILLY VITORIA DE OLIVEIRA MARTINS',           'Faturista',                            'Faturamento',                          '104082',          'faturamento',            false),
    ('104293@interno.local',      'EMILY EMANUELY FERREIRA SAMPAIO',              'AUXILIAR DE SUPRIMENTOS',              'Suprimentos',                          '104293',          'funcionario',            false),
    ('102489@interno.local',      'ERIVALDA MARIA DA SILVA',                      'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102489',          'funcionario',            true),
    ('102500@interno.local',      'FABIO EUSTAQUIO OLIVEIRA ROSA',                'ENFERMEIRO (A)',                        'Enfermagem',                           '102500',          'enfermagem',             true),
    ('3900017@interno.local',     'FELIPE SILVA DOS SANTOS',                      'ENFERMEIRO (A)',                        'Enfermagem',                           '3900017',         'enfermagem',             false),
    ('102484@interno.local',      'FERNANDA ALVES BARCELOS',                      'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102484',          'enfermagem',             true),
    ('102549@interno.local',      'FRANCI HELLEN DE SOUZA SENA',                  'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102549',          'enfermagem',             true),
    ('103459@interno.local',      'FRANCIELLE CAROLINA SILVA NUNES',              'RECEPCIONISTA',                        'Recepção',                             '103459',          'recepcao',               false),
    ('102545@interno.local',      'FRANCISCA GEANE NUNES DA SILVA',               'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102545',          'enfermagem',             true),
    ('3900147@interno.local',     'FRANCISCO XAVIER DA SILVA JUNIOR',             'AUXILIAR ADMINISTRATIVO',              'Administrativo',                       '3900147',         'funcionario',            false),
    ('102604@interno.local',      'FRANKLIN JOSE FERREIRA',                       'CONDUTOR DE AMBULÂNCIA',               'Transporte',                           '102604',          'funcionario',            true),
    ('3900071@interno.local',     'GABRIELLA MICHELLY CAMPANHA DE SOUZA VASCONCELOS', 'Técnico de Enfermagem',            'Enfermagem',                           '3900071',         'enfermagem',             false),
    ('102554@interno.local',      'GEANCARLOS CARDOSO COSTA DOS SANTOS',          'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102554',          'funcionario',            true),
    ('102508@interno.local',      'GERSON APARECIDO FARIA',                       'RECEPCIONISTA',                        'Recepção',                             '102508',          'recepcao',               false),
    ('104517@interno.local',      'GISELLY MAGALHAES SILVA CUNHA',                'FARMACEUTICA (O)',                      'Farmácia',                             '104517',          'farmaceutico_rt',        true),
    ('102494@interno.local',      'GLEISON BIGAO DA SILVA',                       'CONDUTOR DE AMBULÂNCIA',               'Transporte',                           '102494',          'funcionario',            true),
    ('3900136@interno.local',     'GRAZIELA DE SOUSA PORTILHO',                   'Técnico de Enfermagem',                'Enfermagem',                           '3900136',         'enfermagem',             false),
    ('102490@interno.local',      'GRAZIELLI APARECIDA CARVALHO',                 'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102490',          'funcionario',            true),
    ('102521@interno.local',      'HOSANA RANAISE BEZERRA DOS SANTOS',            'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102521',          'enfermagem',             true),
    ('102567@interno.local',      'ITALO MOISES CAMARGOS LUCENA',                 'AUXILIAR ADMINISTRATIVO',              'Administrativo',                       '102567',          'funcionario',            false),
    ('102511@interno.local',      'JAILSON DOS SANTOS PEGO QUEIROZ',              'RECEPCIONISTA',                        'Recepção',                             '102511',          'recepcao',               false),
    ('102493@interno.local',      'JOAO VICTOR ALVES DA SILVA',                   'CONDUTOR DE AMBULÂNCIA',               'Transporte',                           '102493',          'funcionario',            true),
    ('3900195@interno.local',     'JOELMA MUNIZ DE JESUS',                        'Técnico de Enfermagem',                'Enfermagem',                           '3900195',         'enfermagem',             false),
    ('102495@interno.local',      'JOSE MILTON DA CRUZ',                          'CONDUTOR DE AMBULÂNCIA',               'Transporte',                           '102495',          'funcionario',            true),
    ('josselia.cordeiro@interno.local', 'Josselia Cordeiro',                      'Nutricionista',                        'Restaurante',                          NULL,              'restaurante',            false),
    ('102501@interno.local',      'JUDITE BATISTA LOPES',                         'ENFERMEIRO (A)',                        'Enfermagem',                           '102501',          'enfermagem',             false),
    ('3900094@interno.local',     'JULIANE DA GLORIA DOS SANTOS MACHADO',         'Coordenador de Enfermagem',            'Enfermagem',                           '3900094',         'coordenador_enfermagem', false),
    ('102539@interno.local',      'JUSSARA DANIELY DE LIMA LEMOS',                'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102539',          'enfermagem',             true),
    ('102507@interno.local',      'KAROLAYNE CRISTINA DE BARROS',                 'PSICOLOGA',                            'Psicologia',                           '102507',          'funcionario',            false),
    ('102525@interno.local',      'LAIS FERNANDA FOUREAUX',                       'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102525',          'enfermagem',             true),
    ('102562@interno.local',      'LAIZE RODRIGUES DA SILVA',                     'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102562',          'enfermagem',             true),
    ('102535@interno.local',      'LARISSA JUNIA CARVALHO DE SOUZA',              'ENFERMEIRO (A)',                        'Enfermagem',                           '102535',          'enfermagem',             true),
    ('104261@interno.local',      'LEANDRO DOS SANTOS PEREIRA',                   'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '104261',          'funcionario',            true),
    ('104276@interno.local',      'LIDIA ELEN VIEIRA DE JESUS',                   'AUXILIAR DE SUPRIMENTOS',              'Suprimentos',                          '104276',          'funcionario',            true),
    ('102690@interno.local',      'LILIAN KATHELEEN ARAUJO DA SILVA',             'AUXILIAR DE SUPRIMENTOS',              'Suprimentos',                          '102690',          'funcionario',            true),
    ('104104@interno.local',      'LORRAINE DE JESUS MARQUES',                    'FARMACEUTICA (O)',                      'Farmácia',                             '104104',          'farmaceutico_rt',        true),
    ('102570@interno.local',      'LUANA PEREIRA BRAGA',                          'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102570',          'funcionario',            true),
    ('104422@interno.local',      'LUCIANA DE SOUZA SANTOS',                      'TECNICO ENFERMAGEM',                   'Enfermagem',                           '104422',          'enfermagem',             true),
    ('103288@interno.local',      'LUIS CARLOS DOS SANTOS JUNIOR',                'RECEPCIONISTA',                        'Recepção',                             '103288',          'recepcao',               false),
    ('maicon.reis@interno.local', 'Maicon Junior Teixeira Reis',                  'PRESTADOR DE SERVIÇOS',                'Manutenção',                           NULL,              'manutencao',             true),
    ('51894@interno.local',       'MARCELA AZEVEDO FREITAS',                      'Responsável Técnico Médico',           'Médicos',                              '51894',           'medicos',                false),
    ('102486@interno.local',      'MARCOS ARIEL CUNHA DOS SANTOS',                'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102486',          'funcionario',            true),
    ('102538@interno.local',      'MARIA APARECIDA DA SILVA',                     'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102538',          'enfermagem',             true),
    ('103023@interno.local',      'MARIA DAS GRACAS SANTOS SOUZA',                'TECNICO ENFERMAGEM',                   'Enfermagem',                           '103023',          'enfermagem',             true),
    ('102606@interno.local',      'MARIA DOROTHY RODRIGUES',                      'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102606',          'funcionario',            true),
    ('3900107@interno.local',     'MARIA LUIZA ASSUNCAO FERREIRA FONTES',         'Técnico de Enfermagem',                'Enfermagem',                           '3900107',         'enfermagem',             false),
    ('maximo.santos@interno.local','Maximo Lima Santos',                          'Gestor',                               'Administração',                        NULL,              'gestor',                 false),
    ('102758@interno.local',      'Maxuel Hanna Chesley',                         'Faturista',                            'Faturamento',                          '102758',          'faturamento',            false),
    ('103191@interno.local',      'MERCIA FERREIRA DE PAULA SOUZA',               'FARMACEUTICA (O)',                      'Farmácia',                             '103191',          'farmaceutico_rt',        true),
    ('102558@interno.local',      'MONICA DE JESUS RODRIGUES',                    'Auxiliar Administrativo',              'Administração',                        '102558',          'funcionario',            false),
    ('102527@interno.local',      'NAYARA CRISTINA SILVEIRA',                     'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102527',          'enfermagem',             true),
    ('104064@interno.local',      'NELAYNE GONCALVES DA SILVA',                   'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '104064',          'funcionario',            true),
    ('102674@interno.local',      'PATRICIA LACERDA DOS SANTOS',                  'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102674',          'enfermagem',             true),
    ('102568@interno.local',      'PEDRO HENRIQUE DE CASTRO BARCELOS',            'SUPERVISOR TECNICO DE RADIOLOGIA',     'Radiologia',                           '102568',          'funcionario',            true),
    ('3900146@interno.local',     'POLYANA SOUZA DE OLIVEIRA',                    'Auxiliar Administrativo NIR',          'NIR',                                  '3900146',         'nir',                    false),
    ('102528@interno.local',      'RADIONARA MILHOMEM DOS SANTOS',                'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102528',          'enfermagem',             true),
    ('102877@interno.local',      'RAYANNE STHEFANY OLIVEIRA FIDELES',            'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102877',          'enfermagem',             true),
    ('997740@interno.local',      'RECEPCAO DA SILVA',                            'Enfermeiro SCIRAS',                    'Enfermagem',                           '997740',          'enfermagem',             false),
    ('102869@interno.local',      'RENATA DE ARAUJO MARQUES GONTIJO',             'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102869',          'enfermagem',             true),
    ('3900078@interno.local',     'RENATA FERNANDA DE MELO',                      'Enfermeiro',                           'Enfermagem',                           '3900078',         'enfermagem',             false),
    ('102530@interno.local',      'RENATA MARIA DA LUZ DA SILVA AMARAL',          'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102530',          'enfermagem',             true),
    ('102557@interno.local',      'RENATO JOSE DA SILVA',                         'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102557',          'enfermagem',             true),
    ('102543@interno.local',      'ROSANGELA GONCALVES DA SILVA',                 'RECEPCIONISTA',                        'Recepção',                             '102543',          'recepcao',               false),
    ('102531@interno.local',      'ROSELI RAIMUNDO FERREIRA',                     'ENFERMEIRO (A)',                        'Enfermagem',                           '102531',          'enfermagem',             true),
    ('102532@interno.local',      'ROSELY FERREIRA DOS SANTOS',                   'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102532',          'enfermagem',             true),
    ('102540@interno.local',      'SARAH COSTA RIBEIRO DA SILVA',                 'RECEPCIONISTA',                        'Recepção',                             '102540',          'recepcao',               false),
    ('102482@interno.local',      'SHELTON STEFANE REIS MOREIRA',                 'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102482',          'enfermagem',             true),
    ('102491@interno.local',      'SIMONE CAMILO',                                'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102491',          'funcionario',            true),
    ('102544@interno.local',      'SIMONE DAS NEVES',                             'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102544',          'enfermagem',             true),
    ('102812@interno.local',      'SOPHIA GABRIELLY LACERDA DOS SANTOS',          'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102812',          'enfermagem',             true),
    ('104014@interno.local',      'STEFHANY SILVA OLIVEIRA',                      'Enfermeiro',                           'Enfermagem',                           '104014',          'enfermagem',             false),
    ('103418@interno.local',      'STELLA MARIANE CUNHA SARAIVA',                 'Auxiliar Administrativo',              'Almoxarifado',                         '103418',          'funcionario',            false),
    ('102601@interno.local',      'TANIA DE OLIVEIRA RODRIGUES MENDES',           'AUX DE SERV GERAIS',                   'Serviços Gerais',                      '102601',          'funcionario',            true),
    ('102498@interno.local',      'THAIS LETICIA PASSOS',                         'Enfermeiro SCIRAS',                    'Enfermagem',                           '102498',          'enfermagem',             false),
    ('102533@interno.local',      'THOMAS ARAUJO DE FARIA SILVA',                 'ENFERMEIRO (A)',                        'Enfermagem',                           '102533',          'enfermagem',             true),
    ('102559@interno.local',      'TIAGO CAMPOS BARBOSA E SILVA',                 'TECNICO ENFERMAGEM',                   'Enfermagem',                           '102559',          'enfermagem',             true),
    ('103020@interno.local',      'VANESSA ALVES CARVALHO',                       'TECNICO ENFERMAGEM',                   'Enfermagem',                           '103020',          'enfermagem',             true),
    ('172502@interno.local',      'VANIA ROBERTA DA SILVA FREITAS',               'Enfermeiro',                           'Enfermagem',                           '172502',          'enfermagem',             false),
    ('102872@interno.local',      'VITOR CAMPOS OLIVEIRA',                        'ENFERMEIRO (A)',                        'Enfermagem',                           '102872',          'enfermagem',             true),
    ('102553@interno.local',      'WAGNER CASTILHO ISIDORO ALVES',                'TECNICO DE RADIOLOGIA',                'Radiologia',                           '102553',          'funcionario',            true),
    ('103170@interno.local',      'WESLLEY TALISOM GONCALVES DA SILVA',           'ENFERMEIRO (A)',                        'Enfermagem',                           '103170',          'enfermagem',             true),
    ('3900185@interno.local',     'YELLY KENIA MOREIRA SILVA',                    'Técnico de Enfermagem',                'Enfermagem',                           '3900185',         'enfermagem',             false)
  ) AS t(email, full_name, cargo, setor, matricula, role_name, deve_trocar)
  LOOP
    -- Verifica se já existe
    SELECT id INTO v_id FROM auth.users WHERE email = r.email;

    IF v_id IS NULL THEN
      v_id := gen_random_uuid();

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
        v_id, 'authenticated', 'authenticated',
        r.email, v_hash,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('full_name', r.full_name)::jsonb,
        now(), now(), '', '', false
      );

      INSERT INTO auth.identities (
        provider_id, user_id, identity_data,
        provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        r.email, v_id,
        json_build_object('sub', v_id::text, 'email', r.email)::jsonb,
        'email', now(), now(), now()
      );
    END IF;

    -- Perfil
    INSERT INTO public.profiles (user_id, full_name, cargo, setor, matricula, deve_trocar_senha)
    VALUES (v_id, r.full_name, r.cargo, r.setor, r.matricula, r.deve_trocar)
    ON CONFLICT (user_id) DO UPDATE
      SET full_name         = r.full_name,
          cargo             = r.cargo,
          setor             = r.setor,
          matricula         = r.matricula,
          deve_trocar_senha = r.deve_trocar,
          updated_at        = now();

    -- Role
    INSERT INTO public.user_roles (user_id, role)
    SELECT v_id, r.role_name::public.app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_id AND role::text = r.role_name
    );

  END LOOP;

  RAISE NOTICE '✅ Usuários criados/atualizados com sucesso. Senha padrão: UPANova@2026';
END $$;
