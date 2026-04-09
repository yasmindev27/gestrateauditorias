-- Diagnostic: expose auth.users column data so we can check via REST
CREATE OR REPLACE FUNCTION public.diagnostico_auth_users()
RETURNS TABLE(
  id uuid,
  email text,
  is_anonymous boolean,
  is_sso_user boolean,
  confirmation_token text,
  recovery_token text,
  aud text,
  role text,
  encrypted_password text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT
    u.id,
    u.email,
    u.is_anonymous,
    u.is_sso_user,
    u.confirmation_token,
    u.recovery_token,
    u.aud,
    u.role,
    LEFT(u.encrypted_password, 20) AS encrypted_password
  FROM auth.users u
  ORDER BY u.created_at
  LIMIT 30;
$$;

-- Also check identities
CREATE OR REPLACE FUNCTION public.diagnostico_auth_identities()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  provider text,
  provider_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id, user_id, provider, provider_id
  FROM auth.identities
  ORDER BY created_at
  LIMIT 30;
$$;
