-- Create table for tracking notifications sent to prefeitura Google Form
CREATE TABLE IF NOT EXISTS public.notificacoes_compulsoria_prefeitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Patient info
  paciente_nome TEXT NOT NULL,
  sexo TEXT, -- Masculino, Feminino
  faixa_etaria TEXT, -- Menor de 5 anos, 6 a 10 anos, etc
  
  -- Notification info
  unidade_saude TEXT,
  mes_preenchimento TEXT, -- Janeiro/2026, Fevereiro/2026, etc
  agravo_doenca TEXT NOT NULL, -- The main disease/condition to notify
  
  -- Form submission tracking
  google_form_url TEXT, -- Pre-filled URL sent or generated
  form_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_sexo CHECK (sexo IS NULL OR sexo IN ('Masculino', 'Feminino')),
  CONSTRAINT valid_faixa_etaria CHECK (
    faixa_etaria IS NULL OR 
    faixa_etaria IN (
      'Menor de 5 anos',
      '6 a 10 anos',
      '11 a 14 anos',
      '15 a 19 anos',
      '20 a 29 anos',
      '30 a 39 anos',
      '40 a 49 anos',
      '50 a 59 anos',
      '60 anos ou mais'
    )
  )
);

-- Enable RLS
ALTER TABLE public.notificacoes_compulsoria_prefeitura ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications"
  ON public.notificacoes_compulsoria_prefeitura
  FOR SELECT
  USING (auth.uid() = user_id OR has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

CREATE POLICY "Users can insert own notifications"
  ON public.notificacoes_compulsoria_prefeitura
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

CREATE POLICY "Users can update own notifications"
  ON public.notificacoes_compulsoria_prefeitura
  FOR UPDATE
  USING (auth.uid() = user_id OR has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]))
  WITH CHECK (auth.uid() = user_id OR has_any_role(auth.uid(), ARRAY['admin', 'gestor']::app_role[]));

-- Index for common queries
CREATE INDEX idx_notificacoes_prefeitura_user_id ON public.notificacoes_compulsoria_prefeitura(user_id);
CREATE INDEX idx_notificacoes_prefeitura_created_at ON public.notificacoes_compulsoria_prefeitura(created_at DESC);
CREATE INDEX idx_notificacoes_prefeitura_mes ON public.notificacoes_compulsoria_prefeitura(mes_preenchimento);
