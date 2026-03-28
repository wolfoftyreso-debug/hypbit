import { db } from '../db/postgres'
import { hashPassword } from '../crypto/password'
import { incrementTokenVersion } from './authService'

// NEVER hard delete users. Set is_active = false.
export interface User {
  id: string
  email: string
  email_verified: boolean
  password_hash: string | null
  full_name: string | null
  org_id: string | null
  roles: string[]
  is_active: boolean
  mfa_enabled: boolean
  failed_login_count: number
  locked_until: Date | null
  token_version: number
  state_version: number
  created_at: Date
  updated_at: Date
  last_login_at: Date | null
  migrated_from: string | null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    'SELECT * FROM ic_users WHERE email = $1',
    [email.toLowerCase()]
  )
  return rows[0] || null
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    'SELECT * FROM ic_users WHERE id = $1',
    [id]
  )
  return rows[0] || null
}

export async function createUser(data: {
  email: string
  password?: string
  full_name?: string
  org_id?: string
  roles?: string[]
}): Promise<User> {
  const passwordHash = data.password ? await hashPassword(data.password) : null
  const { rows } = await db.query<User>(
    `INSERT INTO ic_users (email, password_hash, full_name, org_id, roles)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.email.toLowerCase(),
      passwordHash,
      data.full_name || null,
      data.org_id || null,
      data.roles || [],
    ]
  )
  return rows[0]
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword)
  const { rows } = await db.query<{ state_version: number }>(
    'SELECT state_version FROM ic_users WHERE id = $1',
    [userId]
  )
  if (!rows[0]) throw new Error('USER_NOT_FOUND')

  // Optimistic lock on state_version — increment token_version to invalidate all JWTs
  await incrementTokenVersion(userId, rows[0].state_version)

  await db.query(
    'UPDATE ic_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hash, userId]
  )
}

export async function setEmailVerified(userId: string): Promise<void> {
  await db.query(
    'UPDATE ic_users SET email_verified = true, updated_at = NOW() WHERE id = $1',
    [userId]
  )
}

// Soft delete only — NEVER hard delete
export async function deactivateUser(userId: string): Promise<void> {
  await db.query(
    'UPDATE ic_users SET is_active = false, updated_at = NOW() WHERE id = $1',
    [userId]
  )
}
