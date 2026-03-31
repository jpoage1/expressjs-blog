// src/utils/logging/config.js
const path = require("path");
const config = require("./index");

const { logging } = config;

const customLevels = {
  levels: config.logging.levels,
  colors: config.logging.colors,
};

const LOG_LEVELS = customLevels.levels;

const { logDir } = config.logging;

const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const sessionDir = path.join(logDir, "sessions", sessionTimestamp);

const logFiles = {
  session: path.join(sessionDir, "session.log"),
  info: path.join(logDir, "info", "info.log"),
  notice: path.join(logDir, "notice", "notice.log"),
  error: path.join(logDir, "error", "error.log"),
  warn: path.join(logDir, "warn", "warn.log"),
  event: path.join(logDir, "event", "event.log"),
  security: path.join(logDir, "security", "security.log"),
  debug: path.join(logDir, "debug", "debug.log"),
  analytics: path.join(logDir, "debug", "analytics.log"),
};

module.exports = {
  customLevels,

  LOG_LEVELS,
  sessionTimestamp,
  sessionDir,
  logFiles,
};
