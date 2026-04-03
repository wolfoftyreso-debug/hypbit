/**
 * CloudflareClient — low-level HTTP client for Cloudflare API.
 *
 * ARCHITECTURE RULE: This is the ONLY place in Wavult OS that may call
 * api.cloudflare.com. No other package, service, or script may do so directly.
 *
 * Token mapping (values live in credentials.env, never in code):
 *   CF_DNS_TOKEN          → wavult-dns-manager       (3fca812d390ed64f37526a465574a9cc)
 *   CF_ZONE_READ_TOKEN    → wavult-zone-read          (a029589b168a26816a0cf9cdaa4e9b75)
 *   CF_TUNNEL_TOKEN       → wavult-tunnel-manager     (3784523b6ea774a9068d5a51619eec0e)
 *   CLOUDFLARE_PAGES_TOKEN → Wrangler Pages Deploy 2026 (d428b1c90d91764bee5bb112b97e2e75)
 */

export class CloudflareError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'CloudflareError';
  }
}

export class CloudflareAuthError extends CloudflareError {
  constructor(path: string) {
    super('Cloudflare authentication failed — check token scope', 9109, path);
    this.name = 'CloudflareAuthError';
  }
}

export class CloudflareNotFoundError extends CloudflareError {
  constructor(path: string) {
    super(`Cloudflare resource not found: ${path}`, 7003, path);
    this.name = 'CloudflareNotFoundError';
  }
}

export type TokenType = 'dns' | 'read' | 'tunnel' | 'pages';

export interface CFClientConfig {
  dnsToken: string;
  readToken: string;
  tunnelToken: string;
  pagesToken: string;
  /** Base URL override for testing */
  baseUrl?: string;
  /** Max retries on rate-limit/server errors (default: 3) */
  maxRetries?: number;
}

export interface CFResponse<T = unknown> {
  success: boolean;
  result: T;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result_info?: { page: number; per_page: number; count: number; total_count: number };
}

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  tokenType: TokenType;
  statusCode: number;
  success: boolean;
  durationMs: number;
}

const DEFAULT_BASE = 'https://api.cloudflare.com/client/v4';

export class CloudflareClient {
  private readonly config: Required<CFClientConfig>;
  private readonly log: RequestLog[] = [];

  constructor(config: CFClientConfig) {
    this.config = {
      baseUrl: DEFAULT_BASE,
      maxRetries: 3,
      ...config,
    };
  }

  /** Retrieve request audit log (token values are never logged). */
  getRequestLog(): Readonly<RequestLog[]> {
    return this.log;
  }

  private selectToken(type: TokenType): string {
    const map: Record<TokenType, string> = {
      dns:    this.config.dnsToken,
      read:   this.config.readToken,
      tunnel: this.config.tunnelToken,
      pages:  this.config.pagesToken,
    };
    return map[type];
  }

  /**
   * Performs an authenticated request to the Cloudflare API.
   * Retries up to maxRetries times on 429 (rate limit) and 503 (server error),
   * using exponential backoff.
   */
  async cfFetch<T = unknown>(
    path: string,
    tokenType: TokenType,
    options: RequestInit = {},
  ): Promise<CFResponse<T>> {
    const token = this.selectToken(tokenType);
    const url = `${this.config.baseUrl}${path}`;
    const start = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
      }

      let statusCode = 0;
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
          },
        });

        statusCode = res.status;

        if (statusCode === 401 || statusCode === 403) {
          this.pushLog(options.method ?? 'GET', path, tokenType, statusCode, false, Date.now() - start);
          throw new CloudflareAuthError(path);
        }
        if (statusCode === 404) {
          this.pushLog(options.method ?? 'GET', path, tokenType, statusCode, false, Date.now() - start);
          throw new CloudflareNotFoundError(path);
        }
        if (statusCode === 429 || statusCode >= 500) {
          lastError = new CloudflareError(`HTTP ${statusCode}`, statusCode, path);
          continue; // retry
        }

        const data = (await res.json()) as CFResponse<T>;
        this.pushLog(options.method ?? 'GET', path, tokenType, statusCode, data.success, Date.now() - start);

        if (!data.success) {
          const msg = data.errors?.[0]?.message ?? 'Unknown Cloudflare error';
          const code = data.errors?.[0]?.code ?? 0;
          throw new CloudflareError(msg, code, path);
        }

        return data;
      } catch (err) {
        if (
          err instanceof CloudflareAuthError ||
          err instanceof CloudflareNotFoundError ||
          err instanceof CloudflareError
        ) {
          throw err;
        }
        lastError = err;
      }
    }

    throw lastError ?? new CloudflareError('Max retries exceeded', 0, path);
  }

  private pushLog(
    method: string,
    path: string,
    tokenType: TokenType,
    statusCode: number,
    success: boolean,
    durationMs: number,
  ): void {
    this.log.push({
      timestamp: new Date().toISOString(),
      method,
      path,
      tokenType,
      statusCode,
      success,
      durationMs,
    });
    // Keep log bounded
    if (this.log.length > 1000) this.log.shift();
  }
}
