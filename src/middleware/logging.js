// src/middleware/logging.js
const morgan = require("morgan");
const logger = require("../utils/logging");

const logFormat =
  ":method :url :status :response-time ms - :res[content-length]";

function createMorgan(stream, skip) {
  return morgan(logFormat, { stream, skip });
}

const morganInfo = createMorgan(
  logger.streams.info,
  (req, res) => res.statusCode >= 400
);

const morganWarn = createMorgan(
  logger.streams.warn,
  (req, res) => res.statusCode < 400 || res.statusCode >= 500
);

const morganError = createMorgan(
  logger.streams.error,
  (req, res) => res.statusCode < 500
);

const loggingMiddleware = (req, res, next) => {
  req.log = logger;
  next();
};

module.exports = {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
};
