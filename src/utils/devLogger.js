/**
 * Development-only logger utility
 * Logs are only shown when NODE_ENV is 'development'
 * In production, all logs are silently ignored
 */

const isDev = process.env.NODE_ENV === 'development';

const devLogger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  // Utility to conditionally log only when explicitly enabled
  verbose: (...args) => {
    if (isDev && localStorage.getItem('verboseLogging') === 'true') {
      console.log('[VERBOSE]', ...args);
    }
  }
};

export default devLogger;
