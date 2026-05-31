// src/utils/logging/config.js
// CHANGED: Removed SQLiteTransport — the synchronous better-sqlite3 writes
// were blocking the event loop on every log call. File-based logging via
// DailyRotateFile and raw streams continues working as before.
const winston = require("winston");

const { patchConsole } = require("./consolePatch");

const { customLevels, sessionDir, logFiles } = require("../../config/logging");

const { createLogStreams, createSessionTransport } = require("./streams");

winston.addColors(customLevels.colors);

const logStreams = createLogStreams(logFiles);
const sessionTransport = createSessionTransport(sessionDir);
patchConsole(logStreams, sessionTransport);

module.exports = {
  logStreams,
  sessionTransport,
  winston,
};
