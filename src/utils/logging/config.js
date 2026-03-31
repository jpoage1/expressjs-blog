// src/utils/logging/index.js
const winston = require("winston");
const SQLiteTransport = require("../SQLiteTransport");

const { patchConsole } = require("./consolePatch");

const { customLevels, sessionDir, logFiles } = require("../../config/logging");

const { createLogStreams, createSessionTransport } = require("./streams");

winston.addColors(customLevels.colors);

const logStreams = createLogStreams(logFiles);
const sessionTransport = createSessionTransport(sessionDir);
const sqliteTransport = new SQLiteTransport();
patchConsole(logStreams, sessionTransport);

module.exports = {
  logStreams,
  sessionTransport,
  sqliteTransport,
  winston,
};
