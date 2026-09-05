-- Better Auth 1.6+/1.7: account identity is scoped by issuer.
-- See https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-is-scoped-by-issuer

ALTER TABLE public.auth_accounts
  ADD COLUMN IF NOT EXISTS issuer TEXT;

-- Credential accounts: issuer = local:credential, account_id = linked user id
UPDATE public.auth_accounts
SET
  issuer = 'local:credential',
  account_id = user_id,
  updated_at = NOW()
WHERE provider_id = 'credential'
  AND (issuer IS NULL OR issuer = '' OR account_id IS DISTINCT FROM user_id);

-- Any remaining non-credential rows without issuer (defensive)
-- Standard OAuth providers (google, github, etc.) match local:oauth:<provider_id>
UPDATE public.auth_accounts
SET
  issuer = 'local:oauth:' || provider_id,
  updated_at = NOW()
WHERE issuer IS NULL OR issuer = '';

-- Collision check before creating unique constraint
DO $$
DECLARE dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT issuer, account_id, COUNT(*) AS cnt
    FROM public.auth_accounts
    GROUP BY issuer, account_id
    HAVING COUNT(*) > 1
  ) dupes;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate (issuer, account_id) pairs detected (% groups). Resolve manually before creating unique index.', dup_count;
  END IF;
END $$;

ALTER TABLE public.auth_accounts
  ALTER COLUMN issuer SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_accounts_issuer_account_id
  ON public.auth_accounts (issuer, account_id);

