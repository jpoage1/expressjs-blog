// src/utils/logging/winston.js
// CHANGED: Removed sqliteTransport from transports array.
// All other transports (DailyRotateFile per level, session, console) unchanged.
const util = require("util");
const { createLogger, format, transports } = require("winston");
const { SPLAT, LEVEL, MESSAGE } = require("triple-beam");

const { customLevels, LOG_LEVEL } = require("../../config/logging");

const { buildTransport } = require("./streams");

const { sessionTransport } = require("./config.js");
const config = require("../../config");

const formatMessage = (info) => {
  const { timestamp, level, message } = info;
  const splat = info[SPLAT] || [];
  const settings = config.logging.prettyPrint;

  const formattedMessage = util.formatWithOptions(
    {
      colors: settings.colors,
      depth: settings.depth,
      breakLength: settings.breakLength,
      compact: settings.compact,
    },
    message,
    ...splat,
  );

  const error =
    splat.find((arg) => arg instanceof Error) ||
    (message instanceof Error ? message : null);

  const stack = error ? `\n${error.stack}` : "";

  return `[${timestamp}] [${level}] ${formattedMessage}${stack}`;
};

const winstonLogger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
    ),
  ),
  transports: [
    buildTransport("info", "info"),
    buildTransport("event", "event"),
    buildTransport("error", "error"),
    buildTransport("warn", "warn"),
    buildTransport("debug", "debug"),
    buildTransport("notice", "notice"),
    buildTransport("security", "security"),
    sessionTransport,
    new transports.Console({
      level: LOG_LEVEL,
      format: format.combine(
        format.splat(),
        format.colorize(),
        format.timestamp(),
        format.printf(formatMessage),
      ),
      transports: [new transports.Console()],
    }),
  ],
});

module.exports = {
  winstonLogger,
};
