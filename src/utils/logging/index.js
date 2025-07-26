// src/utils/logging/index.js
const fs = require("fs");
const path = require("path");
const util = require("util");
const winston = require("winston");
const SQLiteTransport = require("../SQLiteTransport");
const { createLogger, format, transports } = winston;

const { patchConsole, shouldLog, writeLog } = require("./consolePatch");
const { formatFunctionName, formatLogMessage } = require("./formatters");
const { functionLog } = require("./functionLogger");

const {
  customLevels,
  LOG_LEVEL,
  logDir,
  sessionTimestamp,
  sessionDir,
  logFiles,
} = require("./config");

const {
  createLogStreams,
  buildTransport,
  createSessionTransport,
} = require("./streams");

winston.addColors(customLevels.colors);

function initializeLogDirectories(files = logFiles) {
  Object.values(files).forEach((filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const functionsLogDir = path.join(logDir, "functions");
  if (!fs.existsSync(functionsLogDir)) {
    fs.mkdirSync(functionsLogDir, { recursive: true });
  }
  return functionsLogDir;
}

const logStreams = createLogStreams(logFiles);
const sessionTransport = createSessionTransport(sessionDir);
const sqliteTransport = new SQLiteTransport();
patchConsole(logStreams, sessionTransport);

const manualLogger = {
  streams: logStreams,
  function: (...args) => functionLog(functionsLogDir, ...args),
  info: (...args) =>
    writeLog("INFO", logStreams.info, sessionTransport, console.log, ...args),
  event: (...args) =>
    writeLog("EVENT", logStreams.event, sessionTransport, console.log, ...args),
  notice: (...args) =>
    writeLog(
      "NOTICE",
      logStreams.notice,
      sessionTransport,
      console.log,
      ...args
    ),
  warn: (...args) =>
    writeLog("WARN", logStreams.warn, sessionTransport, console.warn, ...args),
  security: (...args) =>
    writeLog(
      "SECURITY",
      logStreams.security,
      sessionTransport,
      console.warn,
      ...args
    ),
  error: (...args) =>
    writeLog(
      "ERROR",
      logStreams.error,
      sessionTransport,
      console.error,
      ...args
    ),
  debug: (...args) =>
    writeLog(
      "DEBUG",
      logStreams.debug,
      sessionTransport,
      console.debug,
      ...args
    ),
  analytics: (...args) =>
    writeLog("ANALYTICS", logStreams.analytics, sessionTransport, ...args),
  sessionInfo: () => ({
    sessionId: sessionTimestamp,
    sessionDir,
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
    buildTransport("event", "event"),
    buildTransport("error", "error"),
    buildTransport("warn", "warn"),
    buildTransport("debug", "debug"),
    buildTransport("notice", "notice"),
    buildTransport("security", "security"),
    sessionTransport,
    new transports.Console({
      level: LOG_LEVEL,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          let stack = meta.stack || "";
          if (stack) delete meta.stack;

          const safeInspect = (input) =>
            typeof input === "string"
              ? input
              : util.inspect(input, { depth: null, colors: false });

          const outputMsg = safeInspect(message);
          const metaString =
            Object.keys(meta).length > 0 ? safeInspect(meta) : "";

          return `[${timestamp}] [${level}] ${outputMsg}\n${stack}\n${metaString}`;
        })
      ),
    }),
    sqliteTransport,
  ],
});

module.exports = {
  manualLogger,
  winstonLogger,
  initializeLogDirectories,
  createLogStreams,
  sessionTransport,
  patchConsole,
  shouldLog,
  writeLog,
  formatFunctionName,
  formatLogMessage,
};
