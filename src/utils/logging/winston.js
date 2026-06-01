// src/#logging/winston.js
const util = require("util");
const { createLogger, format, transports } = require("winston");

const { customLevels, LOG_LEVEL } = require("#config").logging;

const { buildTransport } = require("./streams.js");

const { sessionTransport } = require("./config.js");

const { formatMessage } = require("#logging/format.js");

const _transports = Object.keys(customLevels.levels).map((t) =>
  buildTransport(t, t),
);
// console.log("customLevels", customLevels);

const winstonLogger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
    ),
  ),
  transports: [
    ..._transports,
    sessionTransport,
    new transports.Console({
      level: LOG_LEVEL,
      format: format.combine(
        format.splat(),
        format.colorize(),
        format.timestamp(),
        format.printf(formatMessage),
      ),
      transports: [new transports.Console()], // ← claude: this does nothing and will confuse you later
    }),
  ],
});

module.exports = {
  winstonLogger,
};
