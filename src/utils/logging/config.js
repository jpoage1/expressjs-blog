// src/#logging/config.js
"use strict";

//
// Initialises log streams and the session transport.
// All config data is passed explicitly into streams functions —
// no config reads happen inside streams.js itself.

const winston = require("winston");
const { logging } = require("#config/loader.js");
const { patchConsole } = require("./consolePatch");
const {
  createLogStreams,
  createSessionTransport,
  buildTransport,
} = require("./streams");
const { PrimitiveError } = require("#utils/primitiveErrors.js");

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

  // Pass data explicitly — streams.js functions are pure, no internal config reads
  _logStreams = createLogStreams(logging.logFiles);
  _sessionTransport = createSessionTransport(
    logging.sessionDir,
    logging.session,
  );

  patchConsole(_logStreams, _sessionTransport);
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

// buildTransport is called by winston.js for each log level.
// We expose it as a factory that closes over the logging config
// so callers just do: buildTransport('info', 'info')
module.exports.buildTransport = function (level, filenamePrefix) {
  return buildTransport(
    level,
    filenamePrefix,
    logging.logDir,
    logging.dailyRotate,
  );
};

module.exports.winston = winston;
