// // src/utils/logging/index.js
// const { patchConsole, unpatchConsole } = require("#logging/consolePatch.js");
// const {
//   formatFunctionName,
//   formatLogMessage,
// } = require("#logging/formatters.js");
// const {
//   initializeLogDirectories,
// } = require("#logging/initializeDirectories.js");
// const { winstonLogger } = require("#logging/winston.js");
// const { logger } = require("#logging/logger.js");

// // winston is fully initialized here — safe to patch console now
// patchConsole(winstonLogger);

// module.exports = {
//   winstonLogger,
//   logger,
//   patchConsole,
//   unpatchConsole,
//   initializeLogDirectories,
//   formatFunctionName,
//   formatLogMessage,
// };
// src/utils/logging.js
const { createLogger, createHandlers } = require("@jpoage1/logger");
const config = require("#config");

const { logger, winstonLogger, patchConsole } = createLogger(config.logging);
patchConsole();

const { handleUncaughtException, handleUnhandledRejection } =
  createHandlers(logger);

module.exports = {
  logger,
  winstonLogger,
  handleUncaughtException,
  handleUnhandledRejection,
};
