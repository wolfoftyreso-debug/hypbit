export const REDIS_URL     = process.env.REDIS_URL     || "redis://redis.wavult.local:6379"
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "kafka.wavult.local:9092"
export const DATABASE_URL  = process.env.EOS_DATABASE_URL || process.env.DATABASE_URL || ""

// ─── Voice Agent env vars (46elks + ElevenLabs + Whisper) ────────────────────
// FORTYSIX_ELKS_USERNAME  — SSM: /wavult/prod/FORTYSIX_ELKS_USERNAME
// FORTYSIX_ELKS_PASSWORD  — SSM: /wavult/prod/FORTYSIX_ELKS_PASSWORD
// FORTYSIX_ELKS_NUMBER    — SSM: /wavult/prod/FORTYSIX_ELKS_NUMBER (köps via voice-purchase.ts)
// ELEVENLABS_API_KEY      — SSM: /wavult/prod/ELEVENLABS_API_KEY
// ELEVENLABS_VOICE_ID     — SSM: /wavult/prod/ELEVENLABS_VOICE_ID (default: Sarah EXAVITQu4vr4xnSDxMaL)
// PUBLIC_BASE_URL         — SSM: /wavult/prod/PUBLIC_BASE_URL (= https://api.wavult.com)
// BERNT_WEBHOOK_URL       — SSM: /wavult/prod/BERNT_WEBHOOK_URL (OpenClaw intern URL, optional)
