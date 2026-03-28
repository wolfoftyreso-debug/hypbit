/**
 * WHOOP API Router — Wavult OS
 *
 * Hanterar OAuth2-flödet, data-hämtning och team-vy.
 * Monteras på /whoop i index.ts.
 *
 * Endpoints:
 *   GET    /whoop/auth            → redirect till WHOOP OAuth (kräver inloggning)
 *   GET    /whoop/callback        → hantera OAuth callback, spara tokens, redirect med connect_code
 *   POST   /whoop/token-exchange  → byt connect_code mot bekräftelse (tokens sparas server-side)
 *   GET    /whoop/status          → är WHOOP kopplat för inloggad user?
 *   GET    /whoop/me              → senaste recovery, sleep, strain
 *   GET    /whoop/team            → aggregerad teamdata (admin)
 *   DELETE /whoop/disconnect      → koppla bort WHOOP
 */

import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { getConfig } from '../config/env';
import {
  exchangeCodeForTokens,
  fetchRecovery,
  fetchSleep,
  fetchStrain,
  fetchWhoopUserId,
  refreshWhoopToken,
} from './whoop-client';
import {
  deleteWhoopTokens,
  getLatestSnapshot,
  getTeamSnapshots,
  getWhoopTokens,
  saveWhoopSnapshot,
  saveWhoopTokens,
} from './whoop-store';

const router = Router();

// ─── Frontend URL ─────────────────────────────────────────────────────────────

function getFrontendUrl(): string {
  return process.env.WHOOP_FRONTEND_URL ?? 'https://wavult-os.pages.dev';
}

// ─── State store — Supabase-baserat (fungerar i multi-instance ECS) ──────────
// State sparas i whoop_oauth_states-tabellen med TTL 10 min och engångsanvändning.

import { supabase } from '../supabase';

async function createState(userId: string): Promise<string> {
  const stateId = randomUUID();
  await supabase.from('whoop_oauth_states').insert({
    state_id: stateId,
    user_id: userId,
  });
  // Rensa gamla states (> 10 min)
  await supabase.from('whoop_oauth_states')
    .delete()
    .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
  return stateId;
}

async function verifyAndConsumeState(state: string): Promise<{ valid: boolean; userId: string | null }> {
  try {
    const { data, error } = await supabase
      .from('whoop_oauth_states')
      .select('user_id, used, created_at')
      .eq('state_id', state)
      .single();

    if (error || !data) return { valid: false, userId: null };
    if (data.used) return { valid: false, userId: null };

    // Kolla TTL (10 min)
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > 10 * 60 * 1000) return { valid: false, userId: null };

    // Markera som använt (engångsanvändning)
    await supabase.from('whoop_oauth_states')
      .update({ used: true })
      .eq('state_id', state);

    return { valid: true, userId: data.user_id };
  } catch {
    return { valid: false, userId: null };
  }
}

// ─── Connect code store (kort-livat, 60 sekunder) ────────────────────────────
// Används för att överföra connection-bekräftelse till frontend utan tokens i URL

interface ConnectCodeEntry {
  userId: string;
  createdAt: number;
}

const connectCodeStore = new Map<string, ConnectCodeEntry>();

function cleanConnectCodes() {
  const sixtySecondsAgo = Date.now() - 60 * 1000;
  for (const [key, val] of connectCodeStore.entries()) {
    if (val.createdAt < sixtySecondsAgo) connectCodeStore.delete(key);
  }
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: Function) {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'Unauthorized — logga in först' });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Forbidden — kräver admin eller manager' });
  }
  next();
}

// ─── Token helper: refresh om nödvändigt ─────────────────────────────────────

async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getWhoopTokens(userId);
  if (!tokens) return null;

  if (tokens.expires_at) {
    const expiresAt = new Date(tokens.expires_at).getTime();
    const fiveMinFromNow = Date.now() + 5 * 60 * 1000;
    if (expiresAt < fiveMinFromNow && tokens.refresh_token) {
      const fresh = await refreshWhoopToken(tokens.refresh_token);
      if (fresh) {
        await saveWhoopTokens(userId, {
          access_token: fresh.access_token,
          refresh_token: fresh.refresh_token,
          expires_at: fresh.expires_at ?? null,
          whoop_user_id: tokens.whoop_user_id,
        });
        return fresh.access_token;
      }
      // Refresh misslyckades — rensa tokens så user vet att de måste koppla om
      await deleteWhoopTokens(userId);
      return null;
    }
  }

  return tokens.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoop/auth — starta OAuth-flödet (kräver inloggning via Bearer header)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/auth', requireAuth, async (req: Request, res: Response) => {
  const cfg = getConfig();
  const userId = (req as any).user.id;

  if (!cfg.WHOOP_CLIENT_ID || !cfg.WHOOP_REDIRECT_URI) {
    return res.status(503).json({
      error: 'WHOOP inte konfigurerat — saknar WHOOP_CLIENT_ID eller WHOOP_REDIRECT_URI',
    });
  }

  const state = await createState(userId);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.WHOOP_CLIENT_ID,
    redirect_uri: cfg.WHOOP_REDIRECT_URI,
    scope: 'read:recovery read:sleep read:workout offline',
    state,
  });

  return res.redirect(`https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /whoop/auth-url — returnera OAuth URL (frontend kan inte göra redirect med Bearer header)
// Frontend POSTar med JWT, får tillbaka en URL att navigera till
// ─────────────────────────────────────────────────────────────────────────────

router.post('/auth-url', requireAuth, async (req: Request, res: Response) => {
  const cfg = getConfig();
  const userId = (req as any).user.id;

  if (!cfg.WHOOP_CLIENT_ID || !cfg.WHOOP_REDIRECT_URI) {
    return res.status(503).json({
      error: 'WHOOP inte konfigurerat — saknar WHOOP_CLIENT_ID eller WHOOP_REDIRECT_URI',
    });
  }

  const state = await createState(userId);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.WHOOP_CLIENT_ID,
    redirect_uri: cfg.WHOOP_REDIRECT_URI,
    scope: 'read:recovery read:sleep read:workout offline',
    state,
  });

  return res.json({ url: `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}` });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoop/callback — hantera OAuth callback
// Tokens sparas server-side. Frontend får ett kort-livat connect_code (60s).
// ─────────────────────────────────────────────────────────────────────────────

router.get('/callback', async (req: Request, res: Response) => {
  const frontendUrl = getFrontendUrl();
  const { code, state, error: oauthError } = req.query as Record<string, string>;

  if (oauthError) {
    console.warn('[WHOOP] OAuth error:', oauthError);
    return res.redirect(`${frontendUrl}/whoop?error=oauth_denied`);
  }

  // Validera state och hämta userId (state är bundet till userId vid skapandet)
  const { valid, userId: stateUserId } = state ? await verifyAndConsumeState(state) : { valid: false, userId: null };
  if (!valid || !stateUserId) {
    console.warn('[WHOOP] Ogiltigt state — CSRF eller session timeout');
    return res.redirect(`${frontendUrl}/whoop?error=invalid_state`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/whoop?error=no_code`);
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens) {
    return res.redirect(`${frontendUrl}/whoop?error=token_exchange_failed`);
  }

  // Spara tokens mot stateUserId (från state, inte req.user som är null vid callback)
  const userId = stateUserId;
  if (userId) {
    try {
      const whoopUserId = await fetchWhoopUserId(tokens.access_token);
      await saveWhoopTokens(userId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expires_at ?? null,
        whoop_user_id: whoopUserId,
      });

      // Initial snapshot
      const [recovery, sleep, strain] = await Promise.all([
        fetchRecovery(tokens.access_token),
        fetchSleep(tokens.access_token),
        fetchStrain(tokens.access_token),
      ]);

      if (recovery || sleep || strain) {
        await saveWhoopSnapshot(userId, {
          recovery_score: recovery?.score ?? null,
          hrv: recovery?.hrv ?? null,
          resting_hr: recovery?.restingHr ?? null,
          sleep_performance: sleep?.performancePercent ?? null,
          sleep_hours: sleep?.durationHours ?? null,
          strain_score: strain?.score ?? null,
        });
      }

      // Skapa connect_code — tokens skickas INTE i URL
      const connectCode = randomUUID();
      cleanConnectCodes();
      connectCodeStore.set(connectCode, { userId, createdAt: Date.now() });

      return res.redirect(`${frontendUrl}/whoop?connected=true&connect_code=${connectCode}`);
    } catch (err) {
      console.warn('[WHOOP] Kunde inte spara tokens:', err instanceof Error ? err.message : 'unknown');
      return res.redirect(`${frontendUrl}/whoop?error=save_failed`);
    }
  } else {
    // Ska inte hända — state validerade men userId saknades
    return res.redirect(`${frontendUrl}/whoop?error=save_failed`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /whoop/token-exchange — byt connect_code mot bekräftelse
// Frontend anropar detta direkt efter callback-redirect
// ─────────────────────────────────────────────────────────────────────────────

router.post('/token-exchange', requireAuth, (req: Request, res: Response) => {
  const { connect_code } = req.body as { connect_code?: string };
  const userId = (req as any).user.id;

  if (!connect_code) {
    return res.status(400).json({ error: 'Saknar connect_code' });
  }

  cleanConnectCodes();
  const entry = connectCodeStore.get(connect_code);

  if (!entry) {
    return res.status(404).json({ error: 'Ogiltig eller utgången connect_code' });
  }

  // Säkerhetskontroll: connect_code måste tillhöra den inloggade användaren
  if (entry.userId !== userId) {
    return res.status(403).json({ error: 'connect_code tillhör annan användare' });
  }

  connectCodeStore.delete(connect_code);
  return res.json({ success: true, connected: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoop/status — är WHOOP kopplat?
// ─────────────────────────────────────────────────────────────────────────────

router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tokens = await getWhoopTokens(userId);
    return res.json({
      connected: !!tokens,
      whoop_user_id: tokens?.whoop_user_id ?? null,
      connected_at: tokens?.connected_at ?? null,
    });
  } catch (err) {
    console.error('[WHOOP] /status error:', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'Internt fel' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoop/me — senaste data (alltid session-baserat)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return res.status(404).json({
        error: 'WHOOP inte kopplat eller token utgången',
        connected: false,
        reason: 'token_expired',
      });
    }

    const [recovery, sleep, strain] = await Promise.all([
      fetchRecovery(accessToken),
      fetchSleep(accessToken),
      fetchStrain(accessToken),
    ]);

    if (recovery || sleep || strain) {
      await saveWhoopSnapshot(userId, {
        recovery_score: recovery?.score ?? null,
        hrv: recovery?.hrv ?? null,
        resting_hr: recovery?.restingHr ?? null,
        sleep_performance: sleep?.performancePercent ?? null,
        sleep_hours: sleep?.durationHours ?? null,
        strain_score: strain?.score ?? null,
      });
    }

    const cached = await getLatestSnapshot(userId);

    return res.json({
      connected: true,
      recovery: recovery ?? { score: cached?.recovery_score, hrv: cached?.hrv, restingHr: cached?.resting_hr },
      sleep: sleep ?? { performancePercent: cached?.sleep_performance, durationHours: cached?.sleep_hours },
      strain: strain ?? { score: cached?.strain_score, kilojoules: null },
      cached: !recovery && !sleep && !strain,
      last_updated: cached?.snapshot_at ?? null,
    });
  } catch (err) {
    console.error('[WHOOP] /me error:', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'Internt fel' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoop/team — aggregerad teamdata (admin/manager)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/team', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const members = await getTeamSnapshots();

    const sorted = [...members].sort((a, b) => {
      const aScore = a.recovery_score ?? 100;
      const bScore = b.recovery_score ?? 100;
      return aScore - bScore;
    });

    const withRecovery = members.filter(m => m.recovery_score !== null);
    const avgRecovery = withRecovery.length > 0
      ? Math.round(withRecovery.reduce((sum, m) => sum + (m.recovery_score ?? 0), 0) / withRecovery.length)
      : null;

    const withSleep = members.filter(m => m.sleep_performance !== null);
    const avgSleep = withSleep.length > 0
      ? Math.round(withSleep.reduce((sum, m) => sum + (m.sleep_performance ?? 0), 0) / withSleep.length)
      : null;

    const withStrain = members.filter(m => m.strain_score !== null);
    const avgStrain = withStrain.length > 0
      ? Math.round((withStrain.reduce((sum, m) => sum + (m.strain_score ?? 0), 0) / withStrain.length) * 10) / 10
      : null;

    return res.json({
      team: sorted,
      averages: { recovery: avgRecovery, sleep: avgSleep, strain: avgStrain },
      total_connected: members.length,
    });
  } catch (err) {
    console.error('[WHOOP] /team error:', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'Internt fel' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /whoop/disconnect — koppla bort WHOOP (inkl. snapshots)
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await deleteWhoopTokens(userId);

    // Radera även snapshots (GDPR — rätt till radering)
    const { supabase } = await import('../supabase');
    await supabase.from('whoop_snapshots').delete().eq('user_id', userId);

    return res.json({ success: true, message: 'WHOOP frånkopplat' });
  } catch (err) {
    console.error('[WHOOP] /disconnect error:', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'Internt fel' });
  }
});

export default router;
