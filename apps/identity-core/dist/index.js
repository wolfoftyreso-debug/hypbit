"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("./config");
const auth_1 = require("./routes/auth");
const sessions_1 = require("./routes/sessions");
const postgres_1 = require("./db/postgres");
const metrics_1 = require("./metrics");
// DEPLOY LADDER (never big-bang):
// Step 1: AUTH_MODE=logging-only (observe, never block)
// Step 2: AUTH_MODE=soft (log failures, don't block)
// Step 3: AUTH_MODE=hard (full enforcement)
// Step 4: AUTH_MODE=identity-core-only (Supabase disabled)
const AUTH_MODE = config_1.config.authMode;
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '1mb' }));
// Request tracing — requestId injected before any route/middleware sees request
app.use((req, _res, next) => {
    req.requestId = crypto_1.default.randomUUID();
    next();
});
// Security headers
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
// Routes
app.use('/v1/auth', auth_1.authRouter);
app.use('/v1/sessions', sessions_1.sessionsRouter);
// Health
app.get('/health', async (_req, res) => {
    const dbOk = await (0, postgres_1.testConnection)();
    res.status(dbOk ? 200 : 503).json({
        status: dbOk ? 'ok' : 'degraded',
        db: dbOk ? 'connected' : 'disconnected',
        authMode: AUTH_MODE,
        authSource: config_1.config.authSource,
        forceLogoutAll: config_1.config.forceLogoutAll,
        version: '1.0.0',
        service: 'identity-core',
        metrics: metrics_1.metrics,
    });
});
async function main() {
    await (0, postgres_1.initSchema)();
    app.listen(config_1.config.port, () => {
        console.log('[Identity Core] Listening', { port: config_1.config.port, authMode: AUTH_MODE, authSource: config_1.config.authSource });
    });
}
main().catch((err) => {
    console.error('[Identity Core] Startup failed:', err);
    process.exit(1);
});
exports.default = app;
// rds-ready Sun Mar 29 00:27:24 UTC 2026
// ─── MIGRATION ENDPOINT (one-time use) ───────────────────────────────────────
app.post('/v1/migrate/from-supabase', async (_req, res) => {
    const authHeader = _req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'wavult-migrate-2026'}`) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    try {
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
        const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
        if (error)
            throw error;
        let migrated = 0;
        let skipped = 0;
        for (const user of data.users) {
            if (!user.email) {
                skipped++;
                continue;
            }
            await postgres_1.db.query(`INSERT INTO ic_users (id, email, email_verified, full_name, org_id, roles, migrated_from, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'supabase', $7)
         ON CONFLICT (email) DO NOTHING`, [user.id, user.email.toLowerCase(), !!user.email_confirmed_at,
                user.user_metadata?.name || null, 'wavult', [], user.created_at]);
            migrated++;
        }
        res.json({ migrated, skipped, total: data.users.length });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
