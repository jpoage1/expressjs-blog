// utils/logging.js
const fs = require("fs");
const path = require("path");
const util = require("util");
const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const SQLiteTransport = require("../utils/SQLiteTransport");
const sqliteTransport = new SQLiteTransport();

// Define the root log directory
const logDir = path.join(__dirname, "..", "..", "logs");
const projectRoot = path.join(__dirname, "..", "..");

// Define log file paths
const logFiles = {
  session: path.join(logDir, "session.log"),
  info: path.join(logDir, "info", "info.log"),
  notice: path.join(logDir, "notice", "notice.log"),
  error: path.join(logDir, "error", "error.log"),
  warn: path.join(logDir, "warn", "warning.log"),
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
  session: fs.createWriteStream(logFiles.session, { flags: "a" }),
  info: fs.createWriteStream(logFiles.info, { flags: "a" }),
  notice: fs.createWriteStream(logFiles.notice, { flags: "a" }),
  error: fs.createWriteStream(logFiles.error, { flags: "a" }),
  warn: fs.createWriteStream(logFiles.warn, { flags: "a" }),
  debug: fs.createWriteStream(logFiles.debug, { flags: "a" }),
};

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

// Generic log writer
function writeLog(level, stream, consoleFn, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  stream.write(logLine);
  logStreams.session.write(logLine);
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
};
// // Winston logger
// const winstonLogger = createLogger({
//   transports: [
//     buildTransport("info", "info"),
//     buildTransport("error", "error"),
//     buildTransport("warn", "warn"),
//     buildTransport("debug", "debug"),
//     buildTransport("notice", "notice"),
//     new transports.Console({
//       level: "debug",
//       format: format.combine(format.colorize(), format.simple()),
//     }),
//   ],
// });
const winstonLogger = createLogger({
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
    new transports.Console({
      level: "debug",
      format: format.combine(format.colorize(), format.simple()),
    }),
    sqliteTransport,
  ],
});

if (process.env.NODE_ENV !== "production") {
  patchConsole();
}
module.exports = {
  manualLogger,
  winstonLogger,
};
