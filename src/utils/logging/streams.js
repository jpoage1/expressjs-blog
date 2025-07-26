const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { format } = winston;

const { logDir } = require("./config");

function createLogStreams(files) {
  return {
    info: fs.createWriteStream(files.info, { flags: "a" }),
    notice: fs.createWriteStream(files.notice, { flags: "a" }),
    error: fs.createWriteStream(files.error, { flags: "a" }),
    warn: fs.createWriteStream(files.warn, { flags: "a" }),
    debug: fs.createWriteStream(files.debug, { flags: "a" }),
    security: fs.createWriteStream(files.security, { flags: "a" }),
    event: fs.createWriteStream(files.event, { flags: "a" }),
  };
}

function createSessionTransport(dir) {
  return new DailyRotateFile({
    dirname: dir,
    filename: "session-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxFiles: "30d",
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) =>
          `[${timestamp}] [${level.toUpperCase()}] ${message}`
      )
    ),
  });
}

function buildTransport(level, filename) {
  return new DailyRotateFile({
    dirname: path.join(logDir, level),
    filename: `${filename}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxFiles: "14d",
    level,
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      })
    ),
  });
}

module.exports = {
  createLogStreams,
  createSessionTransport,
  buildTransport,
};
