const { winstonLogger } = require("../utils/logging");
const { logger } = require("../utils/logging/logger.js");

// Middleware to inject logger into req
const loggingMiddleware = (req, res, next) => {
  req.log = winstonLogger;
  req.logger = logger;
  next();
};

module.exports = {
  loggingMiddleware,
};
