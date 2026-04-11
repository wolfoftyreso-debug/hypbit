import pino, { Logger } from 'pino';

export interface LoggerOptions {
  service: string;
  level?: string;
  pretty?: boolean;
}

export function createLogger(opts: LoggerOptions): Logger {
  return pino({
    name: opts.service,
    level: opts.level ?? process.env.LOG_LEVEL ?? 'info',
    base: { service: opts.service, env: process.env.NODE_ENV ?? 'development' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        '*.password',
        '*.token',
        '*.secret',
        '*.apiKey',
        '*.pii',
      ],
      censor: '[REDACTED]',
    },
    transport: opts.pretty
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  });
}
