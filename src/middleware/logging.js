const { winstonLogger } = require("../utils/logging");
const structuredLogger = require("../utils/structuredLogger");

const morganInfo = structuredLogger("info");
const morganWarn = structuredLogger("warn");
const morganError = structuredLogger("error");

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
};
