-- Segrega indicadores por origem para evitar mistura entre setores (ex.: enfermagem x medicos)
-- e melhorar rastreabilidade para backup/auditoria.

ALTER TABLE public.upa_indicators
  ADD COLUMN IF NOT EXISTS origem_setor TEXT,
  ADD COLUMN IF NOT EXISTS origem_role TEXT,
  ADD COLUMN IF NOT EXISTS origem_usuario_id UUID;

-- Registros antigos sem rastreabilidade passam a legado.
UPDATE public.upa_indicators
SET origem_setor = 'legado'
WHERE origem_setor IS NULL;

ALTER TABLE public.upa_indicators
  ALTER COLUMN origem_setor SET DEFAULT 'enfermagem',
  ALTER COLUMN origem_setor SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'upa_indicators_origem_setor_check'
  ) THEN
    ALTER TABLE public.upa_indicators
      ADD CONSTRAINT upa_indicators_origem_setor_check
      CHECK (
        origem_setor IN (
          'enfermagem',
          'medicos',
          'qualidade',
          'nir',
          'gestao',
          'outros',
          'legado'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_upa_indicators_origem_periodo
  ON public.upa_indicators (origem_setor, ano, mes);

CREATE INDEX IF NOT EXISTS idx_upa_indicators_origem_usuario
  ON public.upa_indicators (origem_usuario_id);
