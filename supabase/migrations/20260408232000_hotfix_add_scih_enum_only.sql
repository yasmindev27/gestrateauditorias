-- Hotfix: garante existencia do valor 'scih' no enum app_role.
-- Necessario quando a UI ja oferece SCIH, mas o banco ainda nao recebeu o novo enum.

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
