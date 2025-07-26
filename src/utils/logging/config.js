// src/utils/logging/config.js
const path = require("path");

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 3,
    event: 2,
    notice: 4,
    info: 5,
    debug: 6,
    analytics: 7, // use a unique value
  },
  colors: {
    error: "red",
    warn: "yellow",
    security: "magenta",
    event: "cyan",
    notice: "cyan",
    info: "green",
    debug: "blue",
    analytics: "gray", // or another distinct color
  },
};

const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || "info";
const LOG_LEVELS = customLevels.levels;

const projectRoot = path.join(__dirname, "..", "..", "..");
const logDir = path.join(projectRoot, "logs");

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
  LOG_LEVEL,
  LOG_LEVELS,
  logDir,
  projectRoot,
  sessionTimestamp,
  sessionDir,
  logFiles,
};
