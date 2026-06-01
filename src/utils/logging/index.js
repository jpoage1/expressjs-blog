// src/logging/index.js

const { patchConsole, shouldLog, writeLog } = require("./consolePatch");
const { formatFunctionName, formatLogMessage } = require("./formatters");

const { initializeLogDirectories } = require("./initializeDirectories.js");
const { logStreams, sessionTransport } = require("./config.js");
patchConsole(logStreams, sessionTransport);

const { manualLogger } = require("./manualLogger.js");
const { winstonLogger } = require("./winston.js");

const { logger } = require("./logger");

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
