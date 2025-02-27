const pino = require('pino');
const levels = pino.levels;
const pinoPretty = require('pino-pretty');

const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === "production" ? "info" : "debug";
const level = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

if (!levels.values[level]) {
  const validLevels = Object.keys(levels.values).join(', ');
  throw new Error(`Log level must be one of: ${validLevels}`);
}

// Default logger instance with pretty print
const defaultLogger = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Colorize the output
      translateTime: 'SYS:standard', // Format the timestamp
    }
  }
});

// Named logger factory
const createLogger = (name) => pino({
  name,
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  }
});

module.exports = {
  defaultLogger,
  createLogger,
};
