# Identity Core

Production-ready Auth & Identity service for Wavult Group.
Replaces Supabase Auth. Runs parallel — zero downtime migration.

**Stack:** Node.js 22, TypeScript strict, Express, PostgreSQL (RDS), DynamoDB, AWS KMS  
**Region:** eu-north-1  
**Port:** 3005

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/auth/login` | Email + password login |
| POST | `/v1/auth/refresh` | Rotate refresh token |
| POST | `/v1/auth/logout` | Revoke session |
| GET | `/v1/sessions/:id` | Get session info |
| DELETE | `/v1/sessions/:id` | Revoke specific session |
| DELETE | `/v1/sessions` | Revoke all user sessions |
| GET | `/health` | Health check |

---

## Security Model

- **Argon2id** passwords (64 MB cost, 3 iterations)
- **JWT** via AWS KMS RS256 in prod, HS256 in dev — 10 min TTL
- **Session rotation** on every refresh (atomic DynamoDB TransactWrite)
- **Replay detection**: rotated/revoked tokens kill the entire chain
- **Token versioning**: `tv` claim + DB check — logout invalidates all tokens immediately
- **Global epoch**: `FORCE_LOGOUT_ALL=true` increments epoch, all tokens issued before epoch rejected
- **Two-layer rate limiting**: per-IP (20/min) + per-email (5/15min)
- **Account lockout**: 5 failed attempts → 15 min lockout
- **User enumeration protection**: timing-normalized responses
- **Audit log**: immutable with SHA256 row checksum
- **Soft delete only**: users are never hard deleted

---

## Service-to-Service Auth

Internal service tokens use a separate issuer: `identity-core-internal`.  
**NEVER** reuse user JWTs for service-to-service calls.  
Configure via `INTERNAL_SERVICE_SECRET` env var.

---

## Migration Policy

- Legacy sessions (Supabase): max lifetime 24h after `AUTH_MODE=identity-core-only`
- Users inactive >6 months: forced password reset on first Identity Core login
- Session chain on cutover: all Supabase sessions expire naturally, no forced revocation
- Migration script is idempotent (`ON CONFLICT DO NOTHING`) — safe to re-run

---

## Go-Live Gate

Before receiving migration order:

- [ ] Global logout propagation < 1 second
- [ ] Replay attack → entire session tree dies
- [ ] 100k concurrent sessions stable
- [ ] KMS latency spike → system denies correctly (never allows)
- [ ] DynamoDB throttle → correct 503, never false auth
- [ ] `FORCE_LOGOUT_ALL=true` → all requests → 401 SYSTEM_LOCKDOWN within 1s
- [ ] `token_version` mismatch → 401 TOKEN_REVOKED, no bypass
- [ ] Global epoch increment revokes all pre-existing tokens

---

## Deploy Ladder

Never big-bang. Promote stages one at a time.

| Stage | `AUTH_MODE` | Behaviour |
|-------|------------|-----------|
| 1 | `logging-only` | Observe only, never block |
| 2 | `soft` | Log failures, don't block |
| 3 | `hard` | Full enforcement |
| 4 | `identity-core-only` | Supabase disabled |

---

## DynamoDB Setup

```bash
# TTL field — must be enabled via CLI (not CloudFormation)
aws dynamodb update-time-to-live \
  --table-name ic-sessions \
  --time-to-live-specification "Enabled=true,AttributeName=expires_at_ttl"

# GSI for revokeAllUserSessions()
aws dynamodb update-table --table-name ic-sessions \
  --attribute-definitions AttributeName=user_id,AttributeType=S \
  --global-secondary-indexes \
    '[{"IndexName":"user_id-index","KeySchema":[{"AttributeName":"user_id","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]'
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3005` | Listen port |
| `NODE_ENV` | `development` | Environment |
| `AUTH_MODE` | `logging-only` | Deploy ladder stage |
| `AUTH_SOURCE` | `supabase` | Active auth source |
| `SERVICE_AUDIENCE` | `wavult-os` | JWT audience for this service |
| `FORCE_LOGOUT_ALL` | `false` | Emergency kill switch |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `wavult_identity` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | _(required)_ | Database password |
| `KMS_KEY_ID` | _(prod required)_ | ARN of KMS signing key |
| `JWT_SECRET` | _(dev only)_ | HS256 secret for local dev |
| `DYNAMO_SESSIONS_TABLE` | `ic-sessions` | DynamoDB table |
| `INTERNAL_SERVICE_SECRET` | _(required)_ | Service-to-service secret |
| `AWS_REGION` | `eu-north-1` | AWS region |
