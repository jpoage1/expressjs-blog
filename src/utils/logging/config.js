const path = require("path");

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2,
    notice: 3,
    info: 4,
    debug: 5,
  },
  colors: {
    error: "red",
    warn: "yellow",
    security: "magenta",
    notice: "cyan",
    info: "green",
    debug: "blue",
  },
};

const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || "info";
const LOG_LEVELS = customLevels.levels;

const logDir = path.join(__dirname, "..", "..", "logs");
const projectRoot = path.join(__dirname, "..", "..");

const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const sessionDir = path.join(logDir, "sessions", sessionTimestamp);

const logFiles = {
  session: path.join(sessionDir, "session.log"),
  info: path.join(logDir, "info", "info.log"),
  notice: path.join(logDir, "notice", "notice.log"),
  error: path.join(logDir, "error", "error.log"),
  warn: path.join(logDir, "warn", "warn.log"),
  debug: path.join(logDir, "debug", "debug.log"),
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
