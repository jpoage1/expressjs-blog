const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { format } = winston;

const { logging } = require("../../../src/config/loader");
const { logDir } = logging;
const config = require("../../config");

function createLogStreams(files) {
  return {
    info: fs.createWriteStream(files.info, { flags: "a" }),
    notice: fs.createWriteStream(files.notice, { flags: "a" }),
    error: fs.createWriteStream(files.error, { flags: "a" }),
    warn: fs.createWriteStream(files.warn, { flags: "a" }),
    debug: fs.createWriteStream(files.debug, { flags: "a" }),
    security: fs.createWriteStream(files.security, { flags: "a" }),
    event: fs.createWriteStream(files.event, { flags: "a" }),
    analytics: fs.createWriteStream(files.analytics, { flags: "a" }),
  };
}

function createSessionTransport(dir) {
  const settings = config.logging.session;

  return new DailyRotateFile({
    dirname: dir,
    filename: settings.filename,
    datePattern: settings.datePattern,
    zippedArchive: settings.zippedArchive,
    maxFiles: settings.maxFiles,
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) =>
          `[${timestamp}] [${level.toUpperCase()}] ${message}`,
      ),
    ),
  });
}

function buildTransport(level, filenamePrefix) {
  const settings = config.logging.dailyRotate;
  const logDir = config.logging.logDir;

  return new DailyRotateFile({
    level: level,
    dirname: path.join(logDir, level),
    filename: `${filenamePrefix}${settings.filenameSuffix}`,
    datePattern: settings.datePattern,
    zippedArchive: settings.zippedArchive,
    maxFiles: settings.maxFiles,
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      }),
    ),
  });
}

module.exports = {
  createLogStreams,
  createSessionTransport,
  buildTransport,
};
