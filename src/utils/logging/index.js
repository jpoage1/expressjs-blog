// src/utils/logging/index.js
const { patchConsole, unpatchConsole } = require("#logging/consolePatch.js");
const {
  formatFunctionName,
  formatLogMessage,
} = require("#logging/formatters.js");
const {
  initializeLogDirectories,
} = require("#logging/initializeDirectories.js");
const { winstonLogger } = require("#logging/winston.js");
const { logger } = require("#logging/logger.js");

// winston is fully initialized here — safe to patch console now
patchConsole(winstonLogger);

module.exports = {
  winstonLogger,
  logger,
  patchConsole,
  unpatchConsole,
  initializeLogDirectories,
  formatFunctionName,
  formatLogMessage,
};
