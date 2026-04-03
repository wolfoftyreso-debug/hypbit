# @wavult/cloudflare-module

**ARKITEKTUREGEL:** All kommunikation med Cloudflare API går via denna modul. Inga direktanrop till `api.cloudflare.com` tillåts från andra delar av systemet.

## Token-mappning

| Env-variabel | Token-namn | ID | Scope |
|---|---|---|---|
| `CF_DNS_TOKEN` | wavult-dns-manager | `3fca812d390ed64f37526a465574a9cc` | DNS:Write, Zone:Read — alla zoner |
| `CF_ZONE_READ_TOKEN` | wavult-zone-read | `a029589b168a26816a0cf9cdaa4e9b75` | Zone:Read, DNS:Read — monitoring |
| `CF_TUNNEL_TOKEN` | wavult-tunnel-manager | `3784523b6ea774a9068d5a51619eec0e` | Tunnel:Write/Read |
| `CLOUDFLARE_PAGES_TOKEN` | Wrangler Pages Deploy 2026 | `d428b1c90d91764bee5bb112b97e2e75` | Pages:Write/Read |

Token-**värden** lagras ALDRIG i kod — de finns i `/home/erikwsl/.openclaw/secrets/credentials.env`.

## Användning

```typescript
import cf from '@wavult/cloudflare-module';

// DNS
const records = await cf.getDNSRecords('5bed27e91d719b3f9d82c234d191ad99'); // wavult.com

// Zoner
const zones = await cf.listZones();

// Pages
const projects = await cf.listPagesProjects();

// Healthcheck
const health = await cf.healthCheck();
// { zones: 29, pages: 10, tunnel: 'down', ok: true }
```

## Återstående manuella steg

Se `docs/cloudflare-migration-report.md` i OpenClaw workspace.

- [ ] Sätt på 2FA: https://dash.cloudflare.com/profile/authentication
- [ ] Revokera gamla tokens (se rapport för lista)
- [ ] Revokera Global API Key (SISTA steget, efter verifiering)
