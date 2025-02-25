// Check if we're running on the server or client
const isServer = typeof window === "undefined";

// Log levels
export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

// Define levels for internal use
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Universal logger interface that works in both browser and server
const createUniversalLogger = () => {
  // Get appropriate log level based on environment
  const getLogLevel = (): LogLevel => {
    const env = process.env.NODE_ENV || "development";
    return env === "development" ? "debug" : "info";
  };

  const currentLevel = getLogLevel();
  const currentLevelValue = levels[currentLevel];

  // Check if a log level should be output based on current level
  const shouldLog = (level: LogLevel): boolean => {
    return levels[level] <= currentLevelValue;
  };

  // Format metadata object to string
  const formatMetadata = (
    metadata: Record<string, any> | undefined
  ): string => {
    if (!metadata || Object.keys(metadata).length === 0) return "";
    try {
      return JSON.stringify(metadata, null, 2);
    } catch (e) {
      return "[Circular or complex metadata]";
    }
  };

  // Get timestamp in YYYY-MM-DD HH:mm:ss format
  const getTimestamp = (): string => {
    const now = new Date();
    return now.toISOString().replace("T", " ").substring(0, 19);
  };

  // Create the actual logger implementation
  return {
    log: (level: LogLevel, message: string, metadata?: Record<string, any>) => {
      if (!shouldLog(level)) return;

      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      const logMessage = `${timestamp} [${level}]: ${message} ${metaStr}`;

      // Use appropriate console method based on level
      switch (level) {
        case "error":
          console.error(logMessage);
          break;
        case "warn":
          console.warn(logMessage);
          break;
        case "info":
          console.info(logMessage);
          break;
        case "http":
        case "debug":
          console.log(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    },
    error: (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog("error")) return;
      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      console.error(`${timestamp} [error]: ${message} ${metaStr}`);
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog("warn")) return;
      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      console.warn(`${timestamp} [warn]: ${message} ${metaStr}`);
    },
    info: (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog("info")) return;
      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      console.info(`${timestamp} [info]: ${message} ${metaStr}`);
    },
    http: (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog("http")) return;
      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      console.log(`${timestamp} [http]: ${message} ${metaStr}`);
    },
    debug: (message: string, metadata?: Record<string, any>) => {
      if (!shouldLog("debug")) return;
      const timestamp = getTimestamp();
      const metaStr = formatMetadata(metadata);
      console.log(`${timestamp} [debug]: ${message} ${metaStr}`);
    },
  };
};

// Create and export the universal logger
const universalLogger = createUniversalLogger();

// Helper function to add request context
export const logWithContext = (
  level: LogLevel,
  message: string,
  context?: Record<string, any>
) => {
  universalLogger.log(level, message, context);
};

export default universalLogger;
