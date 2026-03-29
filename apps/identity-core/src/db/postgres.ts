import { Pool } from 'pg'
import { config } from '../config'

export const db = new Pool(config.db)

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

    CREATE INDEX IF NOT EXISTS idx_ic_users_email ON ic_users(email);
    CREATE INDEX IF NOT EXISTS idx_ic_auth_events_user ON ic_auth_events(user_id);
  `

  try {
    await db.query(schemaSQL)
    console.log('[DB] Schema initialized successfully')
  } catch (err) {
    console.error('[DB] Schema initialization failed:', err)
    throw err
  }
}
