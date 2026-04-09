-- RLS SCIH para telas de Epidemiologia/Arboviroses no modulo Enfermagem.
-- Libera leitura e operacoes de sincronizacao para perfis assistenciais de governanca clinica.

-- -----------------------------------------------------------------------------
-- notificacoes_arboviroses
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.notificacoes_arboviroses') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notificacoes_arboviroses ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "notificacoes_arboviroses_select" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "notificacoes_arboviroses_insert" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "notificacoes_arboviroses_update" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "notificacoes_arboviroses_delete" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view notificacoes_arboviroses" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert notificacoes_arboviroses" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update notificacoes_arboviroses" ON public.notificacoes_arboviroses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete notificacoes_arboviroses" ON public.notificacoes_arboviroses';

    EXECUTE $sql$
      CREATE POLICY "notificacoes_arboviroses_select"
      ON public.notificacoes_arboviroses
      FOR SELECT TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "notificacoes_arboviroses_insert"
      ON public.notificacoes_arboviroses
      FOR INSERT TO authenticated
      WITH CHECK (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "notificacoes_arboviroses_update"
      ON public.notificacoes_arboviroses
      FOR UPDATE TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "notificacoes_arboviroses_delete"
      ON public.notificacoes_arboviroses
      FOR DELETE TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- sciras_notificacoes_epidemiologicas
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.sciras_notificacoes_epidemiologicas') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sciras_notificacoes_epidemiologicas ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "sciras_notificacoes_epidemiologicas_select" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "sciras_notificacoes_epidemiologicas_insert" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "sciras_notificacoes_epidemiologicas_update" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "sciras_notificacoes_epidemiologicas_delete" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view sciras_notificacoes_epidemiologicas" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert sciras_notificacoes_epidemiologicas" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update sciras_notificacoes_epidemiologicas" ON public.sciras_notificacoes_epidemiologicas';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete sciras_notificacoes_epidemiologicas" ON public.sciras_notificacoes_epidemiologicas';

    EXECUTE $sql$
      CREATE POLICY "sciras_notificacoes_epidemiologicas_select"
      ON public.sciras_notificacoes_epidemiologicas
      FOR SELECT TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "sciras_notificacoes_epidemiologicas_insert"
      ON public.sciras_notificacoes_epidemiologicas
      FOR INSERT TO authenticated
      WITH CHECK (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "sciras_notificacoes_epidemiologicas_update"
      ON public.sciras_notificacoes_epidemiologicas
      FOR UPDATE TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "sciras_notificacoes_epidemiologicas_delete"
      ON public.sciras_notificacoes_epidemiologicas
      FOR DELETE TO authenticated
      USING (
        has_any_role(
          auth.uid(),
          ARRAY[
            'admin',
            'gestor',
            'qualidade',
            'nsp',
            'enfermagem',
            'coordenador_enfermagem',
            'scih'
          ]::app_role[]
        )
      )
    $sql$;
  END IF;
END$$;
