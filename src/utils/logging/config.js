// src/utils/logging/config.js
"use strict";
const winston = require("winston");
const { logging } = require("#config/loader.js");
const {
  createLogStreams,
  createSessionTransport,
  buildTransport,
} = require("./streams");
const { PrimitiveError } = require("#errors");

let _logStreams = null;
let _sessionTransport = null;
let _initialized = false;

function initialize() {
  if (_initialized) return;
  _initialized = true;
  try {
    winston.addColors(logging.customLevels.colors);
  } catch (e) {
    PrimitiveError("Custom colors are not available", e).notice;
  }
  _logStreams = createLogStreams(logging.logFiles);
  _sessionTransport = createSessionTransport(
    logging.sessionDir,
    logging.session,
  );
  // patchConsole removed — index.js handles this after winstonLogger is ready
}

Object.defineProperty(module.exports, "logStreams", {
  get() {
    initialize();
    return _logStreams;
  },
  enumerable: true,
});
Object.defineProperty(module.exports, "sessionTransport", {
  get() {
    initialize();
    return _sessionTransport;
  },
  enumerable: true,
});
module.exports.buildTransport = function (level, filenamePrefix) {
  return buildTransport(
    level,
    filenamePrefix,
    logging.logDir,
    logging.dailyRotate,
  );
};
module.exports.winston = winston;
