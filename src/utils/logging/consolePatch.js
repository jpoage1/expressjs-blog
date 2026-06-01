// src/#logging/consolePatch.js
const util = require("util");

const config = require("#config");
const log_levels = config.logging.levels;

function shouldLog(level) {
  return log_levels[level.toLowerCase()] <= log_levels[config.logging.logLevel];
}

const originalConsole = { ...console };

function patchConsole(logStreams, sessionTransport) {
  console.log = (...args) =>
    writeLog(
      "INFO",
      logStreams.info,
      sessionTransport,
      originalConsole.log,
      ...args,
    );
  console.error = (...args) =>
    writeLog(
      "ERROR",
      logStreams.error,
      sessionTransport,
      originalConsole.error,
      ...args,
    );
  console.warn = (...args) =>
    writeLog(
      "WARN",
      logStreams.warn,
      sessionTransport,
      originalConsole.warn,
      ...args,
    );
  console.info = (...args) =>
    writeLog(
      "INFO",
      logStreams.info,
      sessionTransport,
      originalConsole.info,
      ...args,
    );
  console.debug = (...args) =>
    writeLog(
      "DEBUG",
      logStreams.debug,
      sessionTransport,
      originalConsole.debug,
      ...args,
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
// function formatArg(arg) {
//   if (arg instanceof Error) {
//     return JSON.stringify(
//       {
//         name: arg.name,
//         message: arg.message,
//         stack: arg.stack,
//       },
//       null,
//       2,
//     );
//   }

//   if (arg instanceof RegExp) {
//     return arg.toString();
//   }

//   if (typeof arg === "object" && arg !== null) {
//     try {
//       return JSON.stringify(arg, getCircularReplacer(), 2);
//     } catch {
//       return util.inspect(arg, { depth: null, colors: false });
//     }
//   }

//   return String(arg);
// }
function formatArg(arg) {
  // This satisfies your "Object Expansion" tests by preventing [object Object]
  if (arg instanceof Error) return arg.stack;
  if (typeof arg === "object" && arg !== null) {
    return util.inspect(arg, { depth: null, colors: false });
  }
  return String(arg);
}

// function formatLog(level, ...args) {
//   const timestamp = new Date().toISOString();
//   // Using util.format ensures objects are expanded and circular refs are handled
//   const message = util.format(...args);
//   const logLine = `[${timestamp}] [${level}] ${message}\n`;

//   return { timestamp, message, logLine };
// }
function formatLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const safeArgs = args.map(formatArg); // Required by your tests
  const message = safeArgs.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  return { timestamp, safeArgs, message, logLine };
}

function writeLog(level, stream, sessionTransport, consoleFn, ...args) {
  if (!shouldLog(level)) return;

  const { timestamp, safeArgs, message, logLine } = formatLog(level, ...args);

  if (stream) stream.write(logLine);
  if (sessionTransport) {
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
