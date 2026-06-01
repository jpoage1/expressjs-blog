// src/utils/logging/config.js
// CHANGED: Removed SQLiteTransport — the synchronous better-sqlite3 writes
// were blocking the event loop on every log call. File-based logging via
// DailyRotateFile and raw streams continues working as before.
const winston = require("winston");

const { patchConsole } = require("./consolePatch");

const { logging } = require("#config");

const { createLogStreams, createSessionTransport } = require("./streams");
const { PrimitiveError } = require("#utils/primitiveErrors.js");

try {
  winston.addColors(logging.customLevels.colors);
} catch (e) {
  PrimitiveError("Custom colors are not available", e).notice;
}

const logStreams = createLogStreams(logging.logFiles);
const sessionTransport = createSessionTransport(logging.sessionDir);
patchConsole(logStreams, sessionTransport);

module.exports = {
  logStreams,
  sessionTransport,
  winston,
};
