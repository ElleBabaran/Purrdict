-- ╔══════════════════════════════════════════════════════════╗
-- ║  PURRDICT — OAuth 2.0 Authorization Server Schema        ║
-- ║  Supports Claude Connector via DCR (RFC 7591) + PKCE     ║
-- ╚══════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════
-- OAUTH CLIENTS (Dynamic Client Registration)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id TEXT PRIMARY KEY DEFAULT 'client_' || encode(gen_random_bytes(16), 'hex'),
  client_secret TEXT,  -- NULL for public clients
  client_name TEXT,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  grant_types TEXT[] NOT NULL DEFAULT '{authorization_code}',
  response_types TEXT[] NOT NULL DEFAULT '{code}',
  scope TEXT,
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  client_id_issued_at BIGINT NOT NULL DEFAULT extract(epoch FROM now())::bigint,
  client_secret_expires_at BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- OAUTH AUTHORIZATION CODES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS oauth_codes (
  code TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT DEFAULT 'S256',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_client ON oauth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_codes(expires_at);

-- ══════════════════════════════════════════════════════════
-- OAUTH ACCESS/REFRESH TOKENS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access ON oauth_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh ON oauth_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);

-- ══════════════════════════════════════════════════════════
-- CLEANUP: Expired codes and tokens
-- ══════════════════════════════════════════════════════════
-- Run periodically: DELETE FROM oauth_codes WHERE expires_at < now();
-- Run periodically: DELETE FROM oauth_tokens WHERE access_token_expires_at < now() AND (refresh_token_expires_at IS NULL OR refresh_token_expires_at < now());
