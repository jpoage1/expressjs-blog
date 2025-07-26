const { winstonLogger } = require("../utils/logging");
const structuredLogger = require("../utils/structuredLogger");

const morganInfo = structuredLogger("info");
const morganWarn = structuredLogger("warn");
const morganError = structuredLogger("error");
const morganEvent = structuredLogger("event");
const morganAnalytics = structuredLogger("analytics");
const morganSecurity = structuredLogger("security");

// Middleware to inject logger into req
const loggingMiddleware = (req, res, next) => {
  req.log = winstonLogger;
  next();
};

module.exports = {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
  morganEvent,
  morganAnalytics,
  morganSecurity,
};
