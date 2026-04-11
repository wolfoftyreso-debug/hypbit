import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface JwtConfig {
  privateKey?: string;
  publicKey?: string;
  secret?: string;
  issuer: string;
  audience: string;
}

export interface JwtPayload {
  sub: string;
  sessionId?: string;
  scope?: string[];
  [k: string]: unknown;
}

export function signJwt(payload: JwtPayload, cfg: JwtConfig, ttlSeconds = 900): string {
  const opts: SignOptions = {
    issuer: cfg.issuer,
    audience: cfg.audience,
    expiresIn: ttlSeconds,
    algorithm: cfg.privateKey ? 'RS256' : 'HS256',
  };
  const key = cfg.privateKey ?? cfg.secret;
  if (!key) throw new Error('jwt signing key missing');
  return jwt.sign(payload, key, opts);
}

export function verifyJwt(token: string, cfg: JwtConfig): JwtPayload {
  const opts: VerifyOptions = {
    issuer: cfg.issuer,
    audience: cfg.audience,
    algorithms: cfg.publicKey ? ['RS256'] : ['HS256'],
  };
  const key = cfg.publicKey ?? cfg.secret;
  if (!key) throw new Error('jwt verification key missing');
  return jwt.verify(token, key, opts) as JwtPayload;
}
