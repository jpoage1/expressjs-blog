const { LOG_LEVEL, LOG_LEVELS } = require("./config");

function shouldLog(level) {
  return LOG_LEVELS[level.toLowerCase()] <= LOG_LEVELS[LOG_LEVEL];
}

const originalConsole = { ...console };

function patchConsole(logStreams) {
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

function writeLog(level, stream, consoleFn, ...args) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  stream.write(logLine);
  sessionTransport.write({ level: level.toLowerCase(), message, timestamp });
  consoleFn(`[${timestamp}] [${level}]`, ...args);
}

module.exports = {
  patchConsole,
  shouldLog,
  writeLog,
};
