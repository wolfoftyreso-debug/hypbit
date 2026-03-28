import * as argon2 from 'argon2'

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB — high security
  timeCost: 3,          // 3 iterations
  parallelism: 4,
  hashLength: 32,
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password, ARGON2_OPTIONS)
}

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < 10) return { valid: false, reason: 'Minst 10 tecken' }
  if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Minst en versal' }
  if (!/[0-9]/.test(password)) return { valid: false, reason: 'Minst en siffra' }
  return { valid: true }
}
