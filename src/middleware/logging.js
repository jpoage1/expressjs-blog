const { winstonLogger } = require("../utils/logging");

// Middleware to inject logger into req
const loggingMiddleware = (req, res, next) => {
  req.log = winstonLogger;
  next();
};

module.exports = {
  loggingMiddleware,
};
