=== Performance Report Sat Mar 21 07:35:31 CET 2026 ===

| Endpoint | Time 1 | Time 2 | Time 3 | Avg | HTTP Status |
|----------|--------|--------|--------|-----|-------------|
| /health | 0.155284s | 0.046036s | 0.145323s | 0.116s | 200 |
| /api/contacts | 0.188973s | 0.100072s | 0.047079s | 0.112s | 401 |
| /api/deals | 0.136843s | 0.162007s | 0.041962s | 0.114s | 401 |
| /api/dashboards/admin | 0.045149s | 0.042852s | 0.043882s | 0.044s | 401 |
| /api/reports/income-statement | 0.140536s | 0.144506s | 0.134614s | 0.140s | 200 |
| /api/capabilities/team | 1.111711s | 0.127684s | 0.133433s | 0.458s | 200 |

## Infrastructure Status (2026-03-21)

### CloudWatch Alarms ✅
- `pixdrift-api-5xx-errors`: Alert when >5 HTTP 5xx errors in 5 minutes
- `pixdrift-ecs-task-stopped`: Alert when ECS task count drops below 1

### S3 Lifecycle Policies ✅
Applied to all 4 production frontend buckets:
- `pixdrift-bc-workstation-prod`
- `pixdrift-bc-admin-prod`
- `pixdrift-bc-crm-prod`
- `pixdrift-bc-sales-prod`

Policy: STANDARD → STANDARD_IA (30 days) → GLACIER (90 days) → Delete (365 days)

### CloudFront Cache Status ⚠️
- Cache MISS observed on pixdrift.com (cold start or misconfigured TTL)
- No gzip compression detected — **ACTION REQUIRED**: Enable compression in CloudFront distribution

### ECS Task Definition
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Container CPU: not set (shares task CPU)
- Env vars: PORT, NODE_ENV, CORS_ORIGIN

### Supabase
- Versioning: N/A (Supabase manages backups internally on Pro/Team plans)
- Index query: public.query() RPC not exposed — use Supabase Dashboard for index analysis

### S3 Versioning ✅
- `pixdrift-bc-workstation-prod`: Enabled
- `hypbit-terraform-state`: Enabled

## npm Security Audit ✅
- Critical: 0
- High: 0  
- Medium: 2 (vite esbuild — requires `npm audit fix --force` with breaking Vite v8 upgrade)
- Low: 0

## Recommended Actions (Priority Order)
1. **CloudFront compression** — Enable gzip/brotli in distribution settings (estimated 60-80% size reduction)
2. **CloudFront cache TTL** — Set cache-control headers for static assets (html: 0s, js/css: 1yr)
3. **/api/capabilities/team** — First request 1.1s (cold start spike) — consider warm-up pings
4. **npm audit fix --force** — Upgrade to Vite 8 when ready (breaking change, test first)
5. **Supabase indexes** — Review via Supabase Dashboard → Database → Indexes for missing indexes on high-traffic tables
