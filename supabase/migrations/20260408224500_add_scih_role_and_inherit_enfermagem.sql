-- Cria role SCIH no enum e garante heranca de permissao de enfermagem.
-- Objetivo: usuario SCIH enxergar tudo que Enfermagem enxerga + aba SCIH.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role'
      AND e.enumlabel = 'scih'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'scih';
  END IF;
END$$;

-- Backfill: quem ja for SCIH recebe tambem role enfermagem.
INSERT INTO public.user_roles (user_id, role)
SELECT ur.user_id, 'enfermagem'::public.app_role
FROM public.user_roles ur
WHERE ur.role::text = 'scih'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role = 'enfermagem'::public.app_role
  );

-- Sincroniza futuras atribuicoes de SCIH para manter role enfermagem junto.
CREATE OR REPLACE FUNCTION public.sync_scih_to_enfermagem_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role::text = 'scih' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = NEW.user_id
        AND ur.role = 'enfermagem'::public.app_role
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'enfermagem'::public.app_role);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_scih_to_enfermagem_role ON public.user_roles;
CREATE TRIGGER trg_sync_scih_to_enfermagem_role
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_scih_to_enfermagem_role();
