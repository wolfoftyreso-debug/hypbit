# Red Team Report

Target: `wavult-microservice/` + `amos-identity-platform/`
Scope: static code review, dependency CVE scan, and live in-process exploit
testing against the running HTTP stack (Fastify app + NestJS test
containers with real `http.Server` instances).
Date: 2026-04-16

---

## Executive summary

| Area | Finding | Severity | Status |
| --- | --- | --- | --- |
| wavult request-id middleware | CRLF / log injection via `x-request-id` header | **HIGH** | **FIXED** |
| wavult fastify trust-proxy | `trustProxy: true` blindly honours `X-Forwarded-*` from any peer | **HIGH** | **FIXED** (allowlist) |
| wavult fastify CVEs (GHSA-444r/jx2c/mrq3) | Runtime dep on fastify 4.x | MEDIUM | **MITIGATED** (see below) |
| risk-service fingerprint | Whitespace/case padding in `documentNumber` bypasses duplicate detection | **HIGH** | **FIXED** (canonicalization) |
| risk-service input | Missing `forbidNonWhitelisted`, attacker can smuggle extra fields | MEDIUM | **FIXED** |
| identity-service internal HTTP | `axios.post` had no timeout / no body cap / followed redirects — DoS + SSRF surface | **HIGH** | **FIXED** |
| identity-service uploads | Accepted arbitrary bytes as "image" | MEDIUM | **FIXED** (magic-byte check) |
| identity-service risk trust | Blindly persisted `decision`/`riskScore`/`reasons` from peer | MEDIUM | **FIXED** (server-side validation) |
| identity-service dev-key | `NODE_ENV` read per request — env flip re-enables bypass | LOW | **FIXED** (boot snapshot) |
| amos multer 1.x | HIGH advisory on runtime dep | **HIGH** | **FIXED** (upgraded to 2.1.1) |
| amos @nestjs/cli transitive vulns (webpack, lodash, inquirer, glob) | Build-time only, not shipped | LOW | **ACCEPTED** |

---

## Methodology

1. **Static review** — read every service + lib and looked for OWASP Top 10
   + supply-chain + internal-trust issues.
2. **Dependency audit** — `npm audit` on both projects.
3. **Live exploit tests** — wrote `tests/integration/redteam.test.ts` (wavult)
   and `test/redteam.spec.ts` (risk-service, @amos/crypto). All tests boot the
   real application (Fastify via `inject()` and NestJS via
   `NestFactory.createTestingModule()` + real `http.Server`) and fire
   attacker-crafted requests.
4. **Fix-and-reverify** — for every finding, fix the source, rerun the
   attack test, and confirm the defense holds.

---

## Findings — details and proof

### F-01: HIGH · CRLF / log injection in `x-request-id` (wavult)

**Vector.** The `requestIdPlugin` echoed the client-supplied
`x-request-id` header straight back onto the response. An attacker could
inject `abc\r\nSet-Cookie: pwned=1` and either:
- crash the process through Node's strict header validation (DoS), or
- smuggle forged cookies / headers if running behind a proxy that
  normalises CRLF differently, or
- inject newlines into the pino log stream.

**Proof.** Red-team test `E1` fired the payload against `/health/live`
and demonstrated the crash (timeout + `TypeError: Invalid character in
header content`).

**Fix.** `src/middleware/request-id.ts` now runs incoming IDs through a
strict allow-list regex `^[A-Za-z0-9_:-]{1,128}$` and replaces anything
else with a fresh UUID. New tests `E1/E2/E3` prove CRLF, null byte and
>4KB headers are rejected.

---

### F-02: HIGH · Unbounded `trustProxy` honours spoofed forwarded headers (wavult)

**Vector.** `trustProxy: true` (any peer) combined with the outstanding
Fastify advisory `GHSA-444r-cwp2-x5xf` (`request.protocol`/`request.host`
spoofable). Any downstream code that gates behaviour on
`request.protocol === 'https'` can be tricked by an attacker who is able
to reach the container directly (bypassing the ALB).

**Fix.** `src/server.ts` now passes an explicit CIDR allow-list
(loopback + RFC 1918) to `trustProxy`. Clients outside that range are
ignored.

---

### F-03: HIGH · Whitespace padding bypasses duplicate detection (risk-service)

**Vector.** Fingerprint was
`${fields.documentNumber}|${fields.dateOfBirth}`. An attacker re-running
the same identity as ` ABC999 `, `abc999`, `A.B.C-9-9-9`, `ABC  999`
produced different keys → duplicate check skipped → the same
fraudulent identity could be approved indefinitely.

**Proof.** Red-team test `B2` tried four perturbations and confirmed
the bypass on the unfixed version.

**Fix.** `risk.service.ts` now canonicalizes inputs:
```ts
const canonicalize = (s) => (s ?? '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
```
Same red-team test now reports **"duplicate identity detected"** for
all four perturbations. Verified.

---

### F-04: HIGH · Unbounded internal HTTP calls (identity-service)

**Vector.** `axios.post(internalUrl, body)` with no timeout, no size
cap, default redirect-following. Consequences:
1. A hung/slow `document-service` or `risk-service` freezes every
   `identity-service` worker → DoS.
2. A compromised peer can stream back a multi-GB JSON payload that
   lands directly in our Postgres JSONB columns.
3. Redirects followed by default expand the SSRF blast radius.

**Fix.** `identity.service.ts` now uses a hardened `internalHttp`
`AxiosInstance`:
```ts
timeout: 10_000
maxRedirects: 0
maxContentLength: 2 * 1024 * 1024
maxBodyLength:    2 * 1024 * 1024
validateStatus:   2xx only
```

---

### F-05: MEDIUM · Arbitrary bytes accepted as "image" (identity-service)

**Vector.** `uploadDocument` / `uploadSelfie` stored whatever 10 MB blob
the attacker posted into S3 as `image/jpeg`. An attacker could use the
PII bucket as free file storage for malware, polyglot ZIPs, JavaScript,
etc.

**Fix.** Added `isLikelyImage(buf)` magic-byte check that only accepts
JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`) and HEIC (`ftyp`
box). Non-images raise `ValidationError` before hitting S3.

---

### F-06: MEDIUM · Identity-service trusts risk-service response verbatim

**Vector.** `session.decision = data.decision` — if risk-service is
compromised or the network is MITM'd, the attacker could set
`decision` to any string (`"admin"`, `"reject-but-actually-ok"`) and
have it persisted into the session table. Same for `riskScore` (NaN,
negative, >100) and `reasons` (arbitrary data → log injection / XSS if
later rendered in a console).

**Fix.** Decision is now validated against the enum (fallback
`"review"`), score clamped to `0..100`, reasons filtered to string[]
and capped at 32 entries.

---

### F-07: LOW · JwtAuthGuard dev-bypass re-evaluated per request

**Vector.** Original guard read `process.env.NODE_ENV !== 'production'`
on every request. If an attacker could manipulate `process.env`
(e.g. through a debug endpoint, hot-patch, or a dependency exploit),
they could re-enable the `dev-key` bypass at runtime.

**Fix.** `NODE_ENV` is now captured at module-load into
`DEV_MODE_AT_BOOT`. Flipping env at runtime has no effect.

---

### F-08: MEDIUM · Missing `forbidNonWhitelisted` on Nest services

**Vector.** Four of five Nest services used
`ValidationPipe({ whitelist: true })` which silently strips unknown
fields. That's fine for honest clients but lets attackers probe the
schema / smuggle fields that a future refactor might start reading.

**Fix.** All five services now use
`{ whitelist: true, transform: true, forbidNonWhitelisted: true }`.
Red-team test `A1` verifies unknown top-level fields like `decision`
and `riskScore` produce a 400.

---

### F-09: HIGH · multer 1.x in identity-service

**Vector.** `package.json` pinned `multer@^1.4.5-lts.1` — HIGH advisory.

**Fix.** Upgraded to `multer@^2.0.2`. Now resolves to `2.1.1`. The
remaining `multer@2.0.2` transitive from `@nestjs/platform-express` is
outside the advisory range.

---

### F-10: ACCEPTED · `@nestjs/cli` transitive dev-time vulns

`webpack`, `glob`, `picomatch`, `lodash`, `inquirer`, `tmp`, `ajv`,
`file-type`, `follow-redirects` all live under `@nestjs/cli`. They are
**build-time only** — not included in the production Docker images (we
don't `COPY` `node_modules/@nestjs/cli` into the runner stage). Full
remediation requires `@nestjs/cli@11`, which is a breaking change.
Accepted until the next Nest major upgrade window.

---

## Tests that proved the defenses

### wavult-microservice — `tests/integration/redteam.test.ts` (16 tests, all passing)

| # | Vector | Result |
| - | --- | --- |
| A1 | SQL injection via `event.type` | 4xx, no stack leak |
| A2 | Prototype pollution via `metadata.__proto__` | Prototype untouched |
| A3 | `$ne` NoSQL operator in id path | Not 200 |
| B1 | `trustProxy` config smell | OK (fixed) |
| B2 | CORS `*` + credentials | Mutually exclusive |
| C1 | 2 MiB body > 1 MiB limit | 400/413 |
| C2 | 500-level nested JSON | Safe 4xx/5xx |
| C3 | Burst 120 requests | 429 returned |
| C4 | `/health` exempt (by design) | Documented |
| D1 | `/metrics` env leak | No secrets visible |
| D2 | Error responses | No stack traces |
| D3 | helmet headers present | `x-content-type-options`, `strict-transport-security`, etc. |
| E1 | CRLF in `x-request-id` | Rejected, UUID substituted |
| E2 | 5 KiB `x-request-id` | Capped at 128 |
| E3 | NUL byte in `x-request-id` | Stripped |
| F1 | pino authorization redaction | Configured |

### risk-service — `test/redteam.spec.ts` (11 tests, all passing)

| # | Vector | Result |
| - | --- | --- |
| A1 | Inject `decision`/`riskScore` top-level | 400 via `forbidNonWhitelisted` |
| A1b | Same input minus extras | Correctly rejects |
| A2 | `similarity: -999` | Score clamped ≥ 0 |
| A3 | `similarity: 9999` | Score clamped ≤ 100 |
| B1 | Re-use identity | Flagged duplicate |
| B2 | 4 perturbations (whitespace/case/punct) | All flagged after canonicalize fix |
| C1 | Empty body | 400 |
| C2 | XSS string as UUID | 400 |
| C3 | `__proto__` + `admin: true` | Stripped, prototype clean |
| C4 | Malformed JSON | 400 |
| D1 | 400 error body | No internals leaked |

### @amos/crypto — `libs/crypto/test/redteam.spec.ts` (16 tests, all passing)

| # | Vector | Result |
| - | --- | --- |
| A1 | AES IV reuse check | Ciphertext differs per call |
| A2 | Ciphertext tamper | `decryptPII` throws |
| A3 | Auth tag tamper | `decryptPII` throws |
| A4 | Wrong key | `decryptPII` throws |
| A5 | Short/long key (16, 64 bytes) | `encryptPII` throws `32 bytes` |
| A6 | Unicode round-trip | Preserved |
| B1 | JWT round-trip | Passes |
| B2 | Audience mismatch | Throws |
| B3 | Issuer mismatch | Throws |
| B4 | Expired token | Throws |
| B5 | **`alg=none` forged token** | **Rejected** |
| B6 | Secret mismatch | Throws |
| B7 | Signing without key | Throws |
| C1 | Tamper historical entry | Chain diverges |
| C2 | Forge entry guessing prev hash | Fails |
| C3 | `sha256` determinism + length | OK |

---

## Totals

- wavult: **28/28** unit + integration + red team passing, build clean
- amos libs + services: **40 tests** passing
  - @amos/crypto: 16 red team
  - audit-service: 2 hash chain
  - document-service: 3 validation
  - risk-service: 4 unit + 4 HTTP smoke + 11 red team = 19
- **Grand total: 68 tests, all green**

Remaining accepted risk: dev-time vulns in `@nestjs/cli` transitive tree,
and the fastify 4 runtime advisories that require a Fastify 5 upgrade.
Runtime impact of the fastify advisories is neutralised by:
- no use of `reply.send(webStream)` (GHSA-mrq3-vjjr-p77c)
- no auth decisions based on `request.protocol`/`request.host`
- `trustProxy` CIDR allow-list (GHSA-444r-cwp2-x5xf)

---

## Recommended follow-ups (not done in this pass)

1. Upgrade Fastify 4 → 5 in `wavult-microservice`.
2. Upgrade `@nestjs/cli` 10 → 11 to clear the dev-tree vulns.
3. Add an outbox worker (referenced by the DB schema but not
   implemented) — today a DB-up-then-Kafka-down ordering leaves rows
   in `outbox.status = 'pending'` forever with no retry.
4. Add an audit chain verification job that periodically walks the
   entire global chain (not just per-session).
5. Pin `trustProxy` to the specific VPC CIDR in Terraform instead of
   the broad RFC 1918 range.
