// Minimal JSON logger with trace-id support. Drop-in replaceable by pino
// or the shared monorepo logger once that is factored out.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

const LOG_MUTED = process.env.LOG_MUTED === '1';

function emit(level: LogLevel, msg: string, fields?: LogFields): void {
  if (LOG_MUTED) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    service: 'quixzoom-connector',
    msg,
    ...fields,
  };
  const line = JSON.stringify(record);
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, fields?: LogFields): void => emit('debug', msg, fields),
  info: (msg: string, fields?: LogFields): void => emit('info', msg, fields),
  warn: (msg: string, fields?: LogFields): void => emit('warn', msg, fields),
  error: (msg: string, fields?: LogFields): void => emit('error', msg, fields),
  child(trace_id: string) {
    return {
      debug: (msg: string, fields?: LogFields): void =>
        emit('debug', msg, { ...fields, trace_id }),
      info: (msg: string, fields?: LogFields): void =>
        emit('info', msg, { ...fields, trace_id }),
      warn: (msg: string, fields?: LogFields): void =>
        emit('warn', msg, { ...fields, trace_id }),
      error: (msg: string, fields?: LogFields): void =>
        emit('error', msg, { ...fields, trace_id }),
    };
  },
};

export type Logger = typeof logger;
