/**
 * WHOOP API Client — Wavult OS
 *
 * Hämtar recovery, sleep och strain från WHOOP Developer API.
 * All kommunikation sker via individuella access_tokens (OAuth2 per person).
 * Token refresh-logik ingår. Alla fel hanteras gracefully.
 */

import { getConfig } from '../config/env';

const WHOOP_BASE = 'https://api.prod.whoop.com/developer';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhoopRecovery {
  score: number;       // 0–100%
  hrv: number;         // ms
  restingHr: number;   // bpm
}

export interface WhoopSleep {
  performancePercent: number; // 0–100%
  durationHours: number;
}

export interface WhoopStrain {
  score: number;       // 0–21
  kilojoules: number;
}

export interface WhoopTokens {
  access_token: string;
  refresh_token: string | null;
  expires_in: number;       // seconds
  expires_at?: string;      // ISO timestamp
  token_type: string;
}

// ─── Internal fetch wrapper ────────────────────────────────────────────────────

async function whoopFetch<T>(
  path: string,
  accessToken: string
): Promise<T | null> {
  try {
    const res = await fetch(`${WHOOP_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[WHOOP] ${path} returned ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[WHOOP] fetch ${path} failed:`, err);
    return null;
  }
}

// ─── Token Refresh ─────────────────────────────────────────────────────────────

export async function refreshWhoopToken(
  refreshToken: string
): Promise<WhoopTokens | null> {
  try {
    const cfg = getConfig();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: cfg.WHOOP_CLIENT_ID ?? '',
      client_secret: cfg.WHOOP_CLIENT_SECRET ?? '',
    });

    const res = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      console.warn(`[WHOOP] Token refresh failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const tokens = (await res.json()) as WhoopTokens;
    // Beräkna expires_at
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    return { ...tokens, expires_at: expiresAt };
  } catch (err) {
    console.error('[WHOOP] refreshWhoopToken error:', err);
    return null;
  }
}

// ─── Exchange authorization code for tokens ────────────────────────────────────

export async function exchangeCodeForTokens(
  code: string
): Promise<WhoopTokens | null> {
  try {
    const cfg = getConfig();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: cfg.WHOOP_CLIENT_ID ?? '',
      client_secret: cfg.WHOOP_CLIENT_SECRET ?? '',
      redirect_uri: cfg.WHOOP_REDIRECT_URI ?? '',
    });

    const res = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      console.warn(`[WHOOP] Code exchange failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const tokens = (await res.json()) as WhoopTokens;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    return { ...tokens, expires_at: expiresAt };
  } catch (err) {
    console.error('[WHOOP] exchangeCodeForTokens error:', err);
    return null;
  }
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

export async function fetchRecovery(accessToken: string): Promise<WhoopRecovery | null> {
  // WHOOP returnerar en lista — vi vill ha den senaste
  const data = await whoopFetch<{ records: any[] }>(
    '/v1/recovery?limit=1',
    accessToken
  );
  const record = data?.records?.[0];
  if (!record) return null;

  return {
    score: record.score?.recovery_score ?? 0,
    hrv: record.score?.hrv_rmssd_milli ?? 0,
    restingHr: record.score?.resting_heart_rate ?? 0,
  };
}

export async function fetchSleep(accessToken: string): Promise<WhoopSleep | null> {
  const data = await whoopFetch<{ records: any[] }>(
    '/v1/sleep?limit=1',
    accessToken
  );
  const record = data?.records?.[0];
  if (!record) return null;

  const durationMs = record.score?.stage_summary?.total_in_bed_time_milli ?? 0;
  return {
    performancePercent: record.score?.sleep_performance_percentage ?? 0,
    durationHours: Math.round((durationMs / 3_600_000) * 10) / 10,
  };
}

export async function fetchStrain(accessToken: string): Promise<WhoopStrain | null> {
  const data = await whoopFetch<{ records: any[] }>(
    '/v1/cycle?limit=1',
    accessToken
  );
  const record = data?.records?.[0];
  if (!record) return null;

  return {
    score: record.score?.strain ?? 0,
    kilojoules: record.score?.kilojoule ?? 0,
  };
}

// ─── Get WHOOP user ID ─────────────────────────────────────────────────────────

export async function fetchWhoopUserId(accessToken: string): Promise<string | null> {
  const data = await whoopFetch<{ user_id: number }>('/v1/user/profile/basic', accessToken);
  return data?.user_id ? String(data.user_id) : null;
}
