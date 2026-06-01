// src/logging/index.js

const { patchConsole, shouldLog, writeLog } = require("./consolePatch.js");
const { formatFunctionName, formatLogMessage } = require("./formatters.js");

const { initializeLogDirectories } = require("./initializeDirectories.js");
const { logStreams, sessionTransport } = require("./config.js");
patchConsole(logStreams, sessionTransport);

const { manualLogger } = require("./manualLogger.js");
const { winstonLogger } = require("./winston.js");

const { logger } = require("./logger.js");

module.exports = {
  manualLogger,
  winstonLogger,
  initializeLogDirectories,
  sessionTransport,
  patchConsole,
  shouldLog,
  writeLog,
  formatFunctionName,
  formatLogMessage,
  logger,
};
