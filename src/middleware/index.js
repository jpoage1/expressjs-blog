// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require("./errorHandler");
const compression = require("compression");
const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const applyProductionSecurity = require("./applyProductionSecurity");
const validateRequestIntegrity = require("./validateRequestIntegrity");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupMiddleware() {
  const app = express();
  app.use(logEvent);
  app.use(morganInfo);
  app.use(morganWarn);
  app.use(morganError);
  app.use(loggingMiddleware);

  if (process.env.NODE_ENV === "production") {
    app.use(applyProductionSecurity());
  }
  app.use(express.json({ limit: "4kb" }));
  app.use(bodyParser.urlencoded({ extended: false, limit: "4kb" }));
  app.use(compression());
  app.use(validateRequestIntegrity());
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
  app.use(errorHandler);
  return app;
}

module.exports = setupMiddleware;
