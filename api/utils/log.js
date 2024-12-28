const pino = require('pino')
const levels = pino.levels

const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === "production" ? "info" : "debug";
const level = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

if (!levels.values[level]) {
  const validLevels = Object.keys(levels.values).join(', ');
  throw new Error(`Log level must be one of: ${validLevels}`);
}

// Default logger instance
const defaultLogger = pino({ level });

// Named logger factory
const createLogger = (name) => pino({ name, level });

module.exports = {
  defaultLogger,
  createLogger,
};