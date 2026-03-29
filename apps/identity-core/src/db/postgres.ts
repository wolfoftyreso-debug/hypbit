import { Pool } from 'pg'
import { config } from '../config'

export const db = new Pool(config.db)

/** Alias for route-level access — returns the shared pool */
export function getDb() { return db }

db.on('error', (err) => {
  console.error('[DB] Unexpected error:', err)
})

export async function testConnection(): Promise<boolean> {
  try {
    await db.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

export async function initSchema(): Promise<void> {
  const schemaSQL = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS ic_users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT false,
      password_hash TEXT,
      full_name TEXT,
      org_id TEXT,
      roles TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      token_version INT DEFAULT 1 NOT NULL,
      session_epoch INT DEFAULT 1 NOT NULL,
      state_version INT DEFAULT 1 NOT NULL,
      failed_login_count INT DEFAULT 0,
      locked_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_login_at TIMESTAMPTZ,
      migrated_from TEXT
    );

    CREATE TABLE IF NOT EXISTS ic_auth_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      session_id TEXT,
      request_id TEXT,
      metadata JSONB DEFAULT '{}',
      row_checksum TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ic_magic_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES ic_users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
      used_at TIMESTAMPTZ,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ic_global_state (
      key TEXT PRIMARY KEY,
      value INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO ic_global_state (key, value) VALUES ('token_epoch', 0), ('token_epoch_changed_at', 0) ON CONFLICT DO NOTHING;

    -- MFA columns (idempotent ALTER TABLE)
    ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
    ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
    ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_secret_pending TEXT;
    ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;
    ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

    -- Extended audit log for compliance (NIS2 / Landvex)
    -- ic_auth_events already exists; ic_auth_audit adds richer fields
    CREATE TABLE IF NOT EXISTS ic_auth_audit (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID,
      event_type TEXT NOT NULL,
      -- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, MFA_SETUP, MFA_ENABLED,
      -- MFA_VERIFIED, MFA_FAILED, PASSWORD_CHANGE, ACCOUNT_LOCKED,
      -- TOKEN_REFRESH, SESSION_REVOKED, SUSPICIOUS_LOGIN
      ip_address TEXT,
      user_agent TEXT,
      country_code TEXT,
      success BOOLEAN NOT NULL DEFAULT true,
      error_code TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ic_users_email ON ic_users(email);
    CREATE INDEX IF NOT EXISTS idx_ic_auth_events_user ON ic_auth_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_ic_auth_audit_user ON ic_auth_audit(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ic_auth_audit_event ON ic_auth_audit(event_type, created_at DESC);
  `

  try {
    await db.query(schemaSQL)
    console.log('[DB] Schema initialized successfully')
  } catch (err) {
    console.error('[DB] Schema initialization failed:', err)
    throw err
  }
}
