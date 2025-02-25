import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'development'
      ? combine(colorize(), devFormat)
      : json()
  ),
  transports: [
    // Always log to console
    new winston.transports.Console(),
    
    // Production file logging
    ...(process.env.NODE_ENV === 'production'
      ? [
          // Error logs
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          // Combined logs
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Helper function to add request context
export const logWithContext = (
  level: keyof typeof levels,
  message: string,
  context?: Record<string, any>
) => {
  logger.log(level, message, context);
};

export default logger;