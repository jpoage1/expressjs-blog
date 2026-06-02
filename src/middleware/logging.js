const { logger } = require("#logging");

// Middleware to inject logger into req
const loggingMiddleware = (req, res, next) => {
  req.log = logger;
  req.logger = logger;
  next();
};

module.exports = {
  loggingMiddleware,
};
