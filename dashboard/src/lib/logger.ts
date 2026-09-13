/**
 * JobWizz Structured Logger Utility
 * Provides leveled logging (debug, info, warn, error) with timestamps,
 * module prefixes, and automatic sensitive data redaction.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Determine minimum log level based on environment
const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const currentLevel: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || DEFAULT_LOG_LEVEL;

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Sensitive keys to automatically redact in objects
const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'apikey',
  'api_key',
  'secret',
  'authorization',
];

/**
 * Deeply redact sensitive information from arguments before logging.
 */
function sanitize(value: any, depth = 0): any {
  if (depth > 5 || value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Redact Bearer tokens
    if (value.startsWith('Bearer ')) {
      return `Bearer ${value.slice(7, 13)}...[REDACTED]`;
    }
    // Redact long secret keys
    if (value.length > 30 && /^(ey[A-Za-z0-9_-]+|AQ\.[A-Za-z0-9_-]+|sb_[A-Za-z0-9_-]+)/.test(value)) {
      return `${value.slice(0, 8)}...[REDACTED]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const lowerKey = k.toLowerCase();
      if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        cleanObj[k] = '[REDACTED]';
      } else {
        cleanObj[k] = sanitize(v, depth + 1);
      }
    }
    return cleanObj;
  }

  return value;
}

class Logger {
  private namespace: string;

  constructor(namespace = 'App') {
    this.namespace = namespace;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= (LOG_LEVELS[currentLevel] ?? LOG_LEVELS.debug);
  }

  private formatPrefix(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    const isServer = typeof window === 'undefined';

    if (isServer) {
      const levelColors: Record<LogLevel, string> = {
        debug: COLORS.gray,
        info: COLORS.cyan,
        warn: COLORS.yellow,
        error: COLORS.red,
      };
      const color = levelColors[level] || COLORS.reset;
      return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}${COLORS.bold}[${level.toUpperCase()}]${COLORS.reset} ${COLORS.blue}[${this.namespace}]${COLORS.reset}`;
    }

    return `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`;
  }

  debug(message: string, ...args: any[]) {
    if (!this.shouldLog('debug')) return;
    const sanitized = args.map((a) => sanitize(a));
    console.debug(this.formatPrefix('debug'), message, ...sanitized);
  }

  info(message: string, ...args: any[]) {
    if (!this.shouldLog('info')) return;
    const sanitized = args.map((a) => sanitize(a));
    console.info(this.formatPrefix('info'), message, ...sanitized);
  }

  warn(message: string, ...args: any[]) {
    if (!this.shouldLog('warn')) return;
    const sanitized = args.map((a) => sanitize(a));
    console.warn(this.formatPrefix('warn'), message, ...sanitized);
  }

  error(message: string, ...args: any[]) {
    if (!this.shouldLog('error')) return;
    const sanitized = args.map((a) => sanitize(a));
    console.error(this.formatPrefix('error'), message, ...sanitized);
  }
}

/**
 * Factory function to create a logger instance for a specific module/namespace.
 * Example:
 *   const log = createLogger('TrackAPI');
 *   log.info('Job application received', { role, company });
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

// Default export with general logger
export const logger = new Logger('JobWizz');
