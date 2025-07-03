// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require("./errorHandler");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const csrf = require("csurf");

const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupMiddleware(app) {
  if (process.env.NODE_ENV === "production") {
    app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://hcaptcha.com"],
          imgSrc: [
            "'self'",
            "data:",
            "https://licensebuttons.net",
            "https://cdn.jsdelivr.net",
            "https://newassets.hcaptcha.com",
          ],
          // add other directives as needed
        },
      })
    ); // Sets secure HTTP headers. Prevents common attacks.
  }
  app.use(express.json());
  app.use(logEvent);
  app.use(compression());
  app.use(morganInfo);
  app.use(morganWarn);
  app.use(morganError);
  app.use(loggingMiddleware);
  app.use("/static", express.static("public"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(formatHtml);
  app.use(routes);
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.statusCode = 404;
    next(err);
  });
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      res.status(403).send("CSRF token invalid.");
      return;
    }
    next(err);
  });
  app.use(errorHandler);
}

module.exports = setupMiddleware;
