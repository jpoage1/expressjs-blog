// utils/logging.js

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2, // Custom level
    notice: 3,
    info: 4,
    debug: 5,
  },
  colors: {
    error: "red",
    warn: "yellow",
    security: "magenta", // Optional color
    notice: "cyan",
    info: "green",
    debug: "blue",
  },
};
const UNCUGHT_EXCEPTION_MSG = "Uncaught Exception:";
const UNHANDLED_REJECTION_MSG = "Unhandled Rejection:";

const fs = require("fs");
const path = require("path");
const util = require("util");

const winston = require("winston");
winston.addColors(customLevels.colors);
const { createLogger, format, transports } = winston;

const DailyRotateFile = require("winston-daily-rotate-file");
const SQLiteTransport = require("../utils/SQLiteTransport");
const sqliteTransport = new SQLiteTransport();

// Define the root log directory
const logDir = path.join(__dirname, "..", "..", "logs");
const projectRoot = path.join(__dirname, "..", "..");

// Create session-specific directory with timestamp
const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const sessionDir = path.join(logDir, "sessions", sessionTimestamp);

// Define log file paths
const logFiles = {
  session: path.join(sessionDir, "session.log"),
  info: path.join(logDir, "info", "info.log"),
  notice: path.join(logDir, "notice", "notice.log"),
  error: path.join(logDir, "error", "error.log"),
  warn: path.join(logDir, "warn", "warn.log"),
  debug: path.join(logDir, "debug", "debug.log"),
};

// Ensure log directories exist
Object.values(logFiles).forEach((filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const functionsLogDir = path.join(logDir, "functions");
if (!fs.existsSync(functionsLogDir)) {
  fs.mkdirSync(functionsLogDir, { recursive: true });
}

const originalConsole = { ...console };

// Create write streams
const logStreams = {
  info: fs.createWriteStream(logFiles.info, { flags: "a" }),
  notice: fs.createWriteStream(logFiles.notice, { flags: "a" }),
  error: fs.createWriteStream(logFiles.error, { flags: "a" }),
  warn: fs.createWriteStream(logFiles.warn, { flags: "a" }),
  debug: fs.createWriteStream(logFiles.debug, { flags: "a" }),
};

// Session-specific daily rotate transport
const sessionTransport = new DailyRotateFile({
  dirname: sessionDir,
  filename: "session-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "30d", // Keep session logs for 30 days
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`
    )
  ),
});

// Utility function for custom function logs
const dynamicCustomStreams = {};

function formatFunctionName(rawPath) {
  const relative = path.relative(projectRoot, rawPath).replace(/\\/g, "/");
  return relative;
}

function formatLogMessage(functionName, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${args.join(" ")}\n`;
}

const functionLog = (functionName, ...args) => {
  const safeFunctionName = formatFunctionName(functionName).replace(
    /[^a-z0-9_\-]/gi,
    "_"
  );
  const message = formatLogMessage(functionName, args);

  if (!dynamicCustomStreams[safeFunctionName]) {
    const customFilePath = path.join(
      functionsLogDir,
      `${safeFunctionName}.log`
    );
    dynamicCustomStreams[safeFunctionName] = fs.createWriteStream(
      customFilePath,
      { flags: "a" }
    );
  }

  dynamicCustomStreams[safeFunctionName].write(message);
  //console.log(`[${functionName}]`, ...args)
};

// Generic log writer with session logging
function writeLog(level, stream, consoleFn, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  // Write to specific log file
  stream.write(logLine);

  // Write to session log via winston transport
  sessionTransport.write({ level: level.toLowerCase(), message, timestamp });

  // Console output
  consoleFn(`[${timestamp}] [${level}]`, ...args);
}

function buildTransport(level, filename) {
  return new DailyRotateFile({
    dirname: path.join(logDir, level),
    filename: `${filename}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxFiles: "14d",
    level,
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) =>
          `[${timestamp}] [${level.toUpperCase()}] ${message}`
      )
    ),
  });
}

function patchConsole() {
  console.log = (...args) =>
    writeLog("INFO", logStreams.info, originalConsole.log, ...args);
  console.error = (...args) =>
    writeLog("ERROR", logStreams.error, originalConsole.error, ...args);
  console.warn = (...args) =>
    writeLog("WARN", logStreams.warn, originalConsole.warn, ...args);
  console.info = (...args) =>
    writeLog("INFO", logStreams.info, originalConsole.info, ...args);
  console.debug = (...args) =>
    writeLog("DEBUG", logStreams.debug, originalConsole.debug, ...args);
}

// Exported logger object
const manualLogger = {
  streams: logStreams,
  function: functionLog,
  info: (...args) => writeLog("INFO", logStreams.info, console.log, ...args),
  notice: (...args) =>
    writeLog("NOTICE", logStreams.notice, console.log, ...args),
  warn: (...args) => writeLog("WARN", logStreams.warn, console.warn, ...args),
  error: (...args) =>
    writeLog("ERROR", logStreams.error, console.error, ...args),
  debug: (...args) =>
    writeLog("DEBUG", logStreams.debug, console.debug, ...args),
  // Add session info method
  sessionInfo: () => ({
    sessionId: sessionTimestamp,
    sessionDir: sessionDir,
    startTime: new Date().toISOString(),
  }),
};

const winstonLogger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`
    )
  ),
  transports: [
    buildTransport("info", "info"),
    buildTransport("error", "error"),
    buildTransport("warn", "warn"),
    buildTransport("debug", "debug"),
    buildTransport("notice", "notice"),
    buildTransport("security", "security"),
    sessionTransport, // Add session transport to winston
    new transports.Console({
      level: "debug",
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          let stack = meta.stack || "";
          if (stack) delete meta.stack;

          // Safely stringify message
          let outputMsg;
          if (typeof message === "string") {
            outputMsg = message;
          } else {
            try {
              outputMsg = JSON.stringify(message, null, 2);
            } catch {
              outputMsg = util.inspect(message, { depth: null, colors: false });
            }
          }

          // Handle meta
          let metaString = "";
          if (Object.keys(meta).length > 0) {
            metaString = util.inspect(meta, { depth: null, colors: false });
          }

          return `[${timestamp}] [${level}] ${outputMsg}\n${stack}\n${metaString}`;
        })
      ),
    }),
    sqliteTransport,
  ],
});

function handleUncaughtException(err) {
  winstonLogger.error(UNCUGHT_EXCEPTION_MSG, err.stack || err);
}

function handleUnhandledRejection(reason) {
  winstonLogger.error(UNHANDLED_REJECTION_MSG, reason?.stack || reason);
}

if (
  process.env.NODE_ENV !== "production" &&
  process.env.NODE_ENV !== "testing"
) {
  patchConsole();
}

module.exports = {
  manualLogger,
  winstonLogger,
  handleUncaughtException,
  handleUnhandledRejection,
};
