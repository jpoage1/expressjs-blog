// src/logging.js
const { createLogger, createHandlers, LogBuffer } = require("@jpoage1/logger");
const config = require("#config");

const { logger, winstonLogger, patchConsole, unpatchConsole } = createLogger(
  config.logging,
);

// Safe to patch console now — winston is fully initialized
patchConsole();

const { handleUncaughtException, handleUnhandledRejection } =
  createHandlers(logger);

module.exports = {
  logger,
  winstonLogger,
  LogBuffer,
  patchConsole,
  unpatchConsole,
  handleUncaughtException,
  handleUnhandledRejection,
  // diskSpaceMonitor stays here if it depends on logger
};
