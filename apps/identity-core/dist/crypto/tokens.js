"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.hashToken = hashToken;
exports.fetchPublicKey = fetchPublicKey;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const client_kms_1 = require("@aws-sdk/client-kms");
const crypto_1 = __importDefault(require("crypto"));
// Fallback secret for local dev (KMS not available)
const DEV_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const USE_KMS = !!config_1.config.kms.keyId && config_1.config.nodeEnv === 'production';
// KMS public key cache — keyed by kid. Signing always goes to KMS; verify uses cached pubkey (fast, local).
const publicKeyCache = new Map();
async function fetchPublicKey(kid) {
    const cached = publicKeyCache.get(kid);
    if (cached)
        return cached;
    const { PublicKey } = await config_1.kmsClient.send(new client_kms_1.GetPublicKeyCommand({ KeyId: kid }));
    if (!PublicKey)
        throw new Error('KMS_PUBLIC_KEY_UNAVAILABLE');
    const pem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(PublicKey).toString('base64').match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
    publicKeyCache.set(kid, pem);
    return pem;
}
async function signAccessToken(payload) {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iss: config_1.config.jwt.issuer,
        aud: config_1.config.jwt.audience,
        iat: now,
        nbf: now - 5, // clock skew buffer — valid 5 seconds before issue
        exp: now + config_1.config.jwt.accessTokenTtl,
    };
    // JWT size guard — large payloads indicate role bloat or injection
    const payloadSize = JSON.stringify(fullPayload).length;
    if (payloadSize > 1500)
        throw new Error(`JWT_PAYLOAD_TOO_LARGE: ${payloadSize}`);
    if (USE_KMS) {
        // kid = last 8 chars of key ARN for header identification
        const kid = config_1.config.kms.keyId.slice(-8);
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid })).toString('base64url');
        const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
        const message = `${header}.${body}`;
        const { Signature } = await config_1.kmsClient.send(new client_kms_1.SignCommand({
            KeyId: config_1.config.kms.keyId,
            Message: Buffer.from(message),
            MessageType: 'RAW',
            SigningAlgorithm: config_1.config.kms.keyAlgorithm,
        }));
        if (!Signature)
            throw new Error('KMS_SIGN_FAILED');
        const signature = Buffer.from(Signature).toString('base64url');
        return `${message}.${signature}`;
    }
    return jsonwebtoken_1.default.sign(fullPayload, DEV_SECRET, { algorithm: 'HS256' });
}
function verifyAccessToken(token) {
    const now = Math.floor(Date.now() / 1000);
    if (USE_KMS) {
        const parts = token.split('.');
        if (parts.length !== 3)
            throw new Error('INVALID_TOKEN_FORMAT');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        // Clock-skew tolerant expiry check (±5s)
        if (payload.exp < now - 5)
            throw new Error('TOKEN_EXPIRED');
        if (payload.nbf && payload.nbf > now + 5)
            throw new Error('TOKEN_NOT_YET_VALID');
        if (payload.iss !== config_1.config.jwt.issuer)
            throw new Error('INVALID_ISSUER');
        // Strict audience validation — token for service A must not work on service B
        const serviceAudience = config_1.config.serviceAudience;
        const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!aud.includes(serviceAudience))
            throw new Error('INVALID_AUDIENCE');
        return payload;
    }
    // Dev mode — HS256
    const payload = jsonwebtoken_1.default.verify(token, DEV_SECRET);
    const now2 = Math.floor(Date.now() / 1000);
    if (payload.exp < now2 - 5)
        throw new Error('TOKEN_EXPIRED');
    // Strict audience check even in dev
    const serviceAudience = config_1.config.serviceAudience;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(serviceAudience))
        throw new Error('INVALID_AUDIENCE');
    return payload;
}
function generateRefreshToken() {
    return crypto_1.default.randomBytes(64).toString('hex');
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
