import { getEnv } from './env';
import * as Sentry from '@sentry/node';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log Level Guidelines:
 * - debug: Detailed information, typically of interest only when diagnosing problems.
 * - info: Confirmation that things are working as expected.
 * - warn: An indication that something unexpected happened, or indicative of a problem that might be continuing. The software is still working as expected.
 * - error: Serious errors that prevent the software from performing its intended function.
 */

interface LogFields {
  level: LogLevel;
  msg: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

const writeLog = (fields: LogFields) => {
  const env = getEnv();
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...fields,
  });

  // eslint-disable-next-line no-console
  console.log(line);

  if (
    env.NODE_ENV === 'production' &&
    env.SENTRY_DSN &&
    fields.level === 'error'
  ) {
    Sentry.captureException(new Error(fields.msg), { extra: fields });
  }
};

export const createLogger = (context?: {
  requestId?: string;
  userId?: string;
  sessionId?: string;
}) => ({
  debug: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: 'debug', msg, ...context, ...extra }),
  info: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: 'info', msg, ...context, ...extra }),
  warn: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: 'warn', msg, ...context, ...extra }),
  error: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: 'error', msg, ...context, ...extra }),
});

export const log = createLogger();
