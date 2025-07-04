// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require("./errorHandler");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const helmet = require("helmet");
const hpp = require("hpp");
// const xss = require("xss-clean");
const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const xssSanitizer = require("./xssSanitizer");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupMiddleware(app) {
  if (process.env.NODE_ENV === "production") {
    app.disable("x-powered-by");
    app.set("trust proxy", true);
    app.use((req, res, next) => {
      console.log(req.ip);
      next();
    });
    app.set("trust-proxy", false);
    app.use(hpp());
    app.use(xssSanitizer);
    // app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));
    app.use((req, res, next) => {
      const host = req.hostname;
      if (["127.0.0.1", "localhost"].includes(host)) {
        const err = new Error("Forbidden");
        err.statusCode = 403;
        return next(err);
      }
      next();
    });
    app.use(helmet.hsts({ maxAge: 63072000 }));

    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://hcaptcha.com"],
          styleSrc: ["'self'", "https:"],
          imgSrc: [
            "'self'",
            "data:",
            "https://licensebuttons.net",
            "https://cdn.jsdelivr.net",
          ],
          frameSrc: ["'self'", "https://newassets.hcaptcha.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],

          // add other directives as needed
        },
      })
    ); // Sets secure HTTP headers. Prevents common attacks.
  }
  app.use(express.json({ limit: "4kb" }));
  app.use(bodyParser.urlencoded({ extended: false, limit: "4kb" }));
  app.use(logEvent);
  app.use(compression());
  app.use(morganInfo);
  app.use(morganWarn);
  app.use(morganError);
  app.use(loggingMiddleware);
  app.use((req, res, next) => {
    const allowedMethods = ["GET", "POST"];
    if (!allowedMethods.includes(req.method)) {
      const err = new Error("Method Not Allowed");
      err.statusCode = 405;
      return next(err);
    }
    next();
  });
  app.use((req, res, next) => {
    if (req.get("content-length") > 4096) {
      const err = new Error("Payload Too Large");
      err.statusCode = 413;
      return next(err);
    }
    next();
  });
  app.use((req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      const err = new Error("File uploads are not allowed.");
      err.statusCode = 400;
      return next(err);
    }
    next();
  });
  app.use((req, res, next) => {
    if (Object.keys(req.headers).length > 100) {
      return res.status(400).send("Too many headers.");
    }
    next();
  });
  app.use(
    "/static",
    express.static("public", {
      dotfiles: "deny",
      index: false,
      extensions: false,
      fallthrough: false,
      setHeaders: (res) => {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      },
    })
  );
  app.use(formatHtml);
  app.use(routes);
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.statusCode = 404;
    next(err);
  });
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      err.message = "CSRF token invalid.";
      err.statusCode = 403;
    }
    next(err);
  });
  app.use(errorHandler);
}

module.exports = setupMiddleware;
