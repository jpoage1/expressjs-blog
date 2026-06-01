// src/utils/logging/winston.js
const { createLogger, format, transports } = require("winston");
const { customLevels, LOG_LEVEL } = require("#config").logging;
const { buildTransport } = require("./streams.js");
const { sessionTransport } = require("./config.js");
const { formatMessage } = require("#logging/format.js");

const winstonLogger = createLogger({
  levels: customLevels.levels,
  transports: [
    ...Object.keys(customLevels.levels).map((t) => buildTransport(t, t)),
    sessionTransport,
    new transports.Console({
      level: LOG_LEVEL,
      format: format.combine(
        format.splat(),
        format.colorize(),
        format.timestamp(),
        format.printf(formatMessage),
      ),
    }),
  ],
});

module.exports = { winstonLogger };
