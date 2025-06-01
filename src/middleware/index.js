// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require("./errorHandler");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const helmet = require("helmet");

const routes = require("../routes");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });

function setupMiddleware(app) {
  app.use(limiter);
  app.use(compression());
  app.use(morganInfo);
  app.use(morganWarn);
  app.use(morganError);
  app.use(loggingMiddleware);
  // app.use(helmet()); // Sets secure HTTP headers. Prevents common attacks.
  app.use("/static", express.static("public"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(routes);
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.statusCode = 404;
    next(err);
  });
  app.use(errorHandler);
}

module.exports = setupMiddleware;
