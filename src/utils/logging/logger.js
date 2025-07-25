const fs = require("fs");
const path = require("path");
const util = require("util");
const winston = require("winston");
const SQLiteTransport = require("../utils/SQLiteTransport");

const { createLogger, format, transports } = winston;

const {
  customLevels,
  LOG_LEVEL,
  logDir,
  projectRoot,
  sessionTimestamp,
  sessionDir,
  logFiles,
} = require("./config");

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

function formatFunctionName(rawPath) {
  const relative = path.relative(projectRoot, rawPath).replace(/\\/g, "/");
  return relative;
}

function formatLogMessage(functionName, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${args.join(" ")}\n`;
}

const dynamicCustomStreams = {};
function functionLog(functionName, ...args) {
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
}

const functionsLogDir = initializeLogDirectories();
const logStreams = createLogStreams(logFiles);
const sessionTransport = createSessionTransport(sessionDir);
const sqliteTransport = new SQLiteTransport();

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

module.exports = {
  manualLogger,
  winstonLogger,
};
