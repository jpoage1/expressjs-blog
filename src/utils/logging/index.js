// src/logging/index.js

const {
  patchConsole,
  shouldLog,
  writeLog,
} = require("#logging/consolePatch.js");
const {
  formatFunctionName,
  formatLogMessage,
} = require("#logging/formatters.js");

const {
  initializeLogDirectories,
} = require("#logging/initializeDirectories.js");
const { logStreams, sessionTransport } = require("#logging/config.js");
patchConsole(logStreams, sessionTransport);

const { manualLogger } = require("#logging/manualLogger.js");
const { winstonLogger } = require("#logging/winston.js");

const { logger } = require("#logging/logger.js");

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
