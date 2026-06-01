// src/#logging/logger.js
const fs = require("fs");
const path = require("path");
const util = require("util");

const {
  formatFunctionName,
  formatLogMessage,
} = require("#logging/formatters.js");
const { functionLog } = require("#logging/functionLogger.js");

const {
  initializeLogDirectories,
} = require("#logging/initializeDirectories.js");

const { winstonLogger } = require("#logging/winston.js");
const { getCallSite } = require("#logging/callSite.js");
const { customLevels } = require("#config").logging;

class Logger {
  constructor() {
    this.functionsLogDir = initializeLogDirectories();
    this.dynamicStreams = {};
    this.winston = winstonLogger;
  }

  print(lines) {
    process.stdout.write(lines + "\n");
  }

  log(level, ...args) {
    this.winston.log(level, ...args);
  }

  info(...args) {
    this.log("info", ...args);
  }
  notice(...args) {
    this.log("notice", ...args);
  }
  warn(...args) {
    this.log("warn", ...args);
  }
  error(...args) {
    this.log("error", ...args);
  }
  debug(...args) {
    this.log("debug", ...args);
  }
  security(...args) {
    this.log("security", ...args);
  }
  event(...args) {
    this.log("event", ...args);
  }
  analytics(...args) {
    this.winston.analytics(...args);
  }

  function(filePath, ...args) {
    const functionName = formatFunctionName(filePath);
    const safeName = functionName.replace(/[^a-z0-9_\-]/gi, "_");

    // Stringify args for the raw file stream
    const message = formatLogMessage(
      functionName,
      args.map((arg) =>
        typeof arg === "object" ? util.inspect(arg, { depth: null }) : arg,
      ),
    );

    if (!this.dynamicStreams[safeName]) {
      const logPath = path.join(this.functionsLogDir, `${safeName}.log`);
      this.dynamicStreams[safeName] = fs.createWriteStream(logPath, {
        flags: "a",
      });
    }

    this.dynamicStreams[safeName].write(message);

    // Also send to main info log for visibility
    this.info(`[${functionName}]`, ...args);
  }

  /**
   * Trace execution time
   */
  async trace(label, operation) {
    const start = performance.now();
    try {
      const result = await (operation instanceof Promise
        ? operation
        : operation());
      return result;
    } finally {
      const duration = (performance.now() - start).toFixed(4);
      this.debug(`[TRACE] ${label}: ${duration}ms`);
    }
  }
}
const logger = new Logger();

const wrappedLogger = new Proxy(logger, {
  get(target, prop) {
    if (
      typeof target[prop] === "function" &&
      customLevels.levels[prop] !== undefined
    ) {
      return (...args) => {
        const callSite = getCallSite();
        return target[prop](...args, { callSite });
      };
    }
    return target[prop];
  },
});

module.exports = {
  logger: wrappedLogger,
};
