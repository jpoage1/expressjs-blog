// src/middleware/logging.js
const morgan = require("morgan");
const { winstonLogger, manualLogger } = require("../utils/logging");

const logFormat =
  ":method :url :status :response-time ms - :res[content-length]";

// function createMorgan(stream, skip) {
//   return morgan(logFormat, { stream, skip });
// }

// const morganInfo = createMorgan(
//   manualLogger.streams.info,
//   (req, res) => res.statusCode >= 400
// );

// const morganWarn = createMorgan(
//   manualLogger.streams.warn,
//   (req, res) => res.statusCode < 400 || res.statusCode >= 500
// );

// const morganError = createMorgan(
//   manualLogger.streams.error,
//   (req, res) => res.statusCode < 500
// );

// const loggingMiddleware = (req, res, next) => {
//   req.log = manualLogger;
//   next();
// };

// Define write streams for morgan using Winston's transports
const createStreamWriter = (level) => {
  return {
    write: (message) => {
      winstonLogger.log({ level, message: message.trim() });
    },
  };
};

// Morgan instances by log level
const morganInfo = morgan(logFormat, {
  stream: createStreamWriter("info"),
  skip: (req, res) => res.statusCode >= 400,
});

const morganWarn = morgan(logFormat, {
  stream: createStreamWriter("warn"),
  skip: (req, res) => res.statusCode < 400 || res.statusCode >= 500,
});

const morganError = morgan(logFormat, {
  stream: createStreamWriter("error"),
  skip: (req, res) => res.statusCode < 500,
});

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
