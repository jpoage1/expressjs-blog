// src/utils/logging/config.js
const config = require("#config/loader.js");

const { logging } = config;

const {
  logDir,
  sessionDir,
  sessionTimestamp,
  logLevel,
  customLevels,
  LOG_LEVELS,
  logFiles,
  getDBFile,
} = config.logging;

module.exports = {
  // The block itself, for consumers that do: const { logging } = require(...)
  logging: config.logging,

  // Flat named exports, for consumers that do: const { logFiles, ... } = require(...)
  logDir,
  sessionDir,
  sessionTimestamp,
  logLevel,
  customLevels,
  LOG_LEVELS,
  logFiles,
  getDBFile,
};
