// src/utils/logging/consolePatch.js
const util = require("util");

const { LOG_LEVEL, LOG_LEVELS } = require("./config");

function shouldLog(level) {
  return LOG_LEVELS[level.toLowerCase()] <= LOG_LEVELS[LOG_LEVEL];
}

const originalConsole = { ...console };

function patchConsole(logStreams, sessionTransport) {
  console.log = (...args) =>
    writeLog(
      "INFO",
      logStreams.info,
      sessionTransport,
      originalConsole.log,
      ...args
    );
  console.error = (...args) =>
    writeLog(
      "ERROR",
      logStreams.error,
      sessionTransport,
      originalConsole.error,
      ...args
    );
  console.warn = (...args) =>
    writeLog(
      "WARN",
      logStreams.warn,
      sessionTransport,
      originalConsole.warn,
      ...args
    );
  console.info = (...args) =>
    writeLog(
      "INFO",
      logStreams.info,
      sessionTransport,
      originalConsole.info,
      ...args
    );
  console.debug = (...args) =>
    writeLog(
      "DEBUG",
      logStreams.debug,
      sessionTransport,
      originalConsole.debug,
      ...args
    );
  return originalConsole;
}

function unpatchConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
}
function formatArg(arg) {
  if (arg instanceof Error) {
    return JSON.stringify(
      {
        name: arg.name,
        message: arg.message,
        stack: arg.stack,
      },
      null,
      2
    );
  }

  if (arg instanceof RegExp) {
    return arg.toString();
  }

  if (typeof arg === "object" && arg !== null) {
    try {
      return JSON.stringify(arg, getCircularReplacer(), 2);
    } catch {
      return util.inspect(arg, { depth: null, colors: false });
    }
  }

  return String(arg);
}

function formatLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const safeArgs = args.map(formatArg);
  const message = safeArgs.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  return { timestamp, safeArgs, message, logLine };
}

function writeLog(level, stream, sessionTransport, consoleFn, ...args) {
  if (!shouldLog(level)) return;

  const { timestamp, safeArgs, message, logLine } = formatLog(level, ...args);

  stream.write(logLine);
  if (!sessionTransport) {
    originalConsole.warn(
      `sessionTransport for log level '${level} is undefined`
    );
  } else {
    sessionTransport.write({ level: level.toLowerCase(), message, timestamp });
  }
  if (consoleFn) {
    consoleFn(`[${timestamp}] [${level}]`, ...safeArgs);
  }
}

module.exports = {
  patchConsole,
  unpatchConsole,
  shouldLog,
  writeLog,
  formatLog,
};
