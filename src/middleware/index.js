// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");

const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const applyProductionSecurity = require("./applyProductionSecurity");
const validateRequestIntegrity = require("./validateRequestIntegrity");
const errorHandler = require("./errorHandler");
const baseContext = require("./baseContext");
const hbs = require("./hbs");
const authCheck = require("./authCheck");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupApp() {
  const app = express();
  const {
    TRUST_PROXY,
    EXCLUDED_PATHS,
    DATA_LIMIT_BYTES,
    RAW_BODY_LIMIT_BYTES,
    RAW_BODY_TYPE,
    FALLBACK_ENCODING,
    FALLBACK_BODY,
  } = require("../constants/middlewareConstants");
  app.set("trust proxy", TRUST_PROXY);

  // General parsers for non-excluded routes
  app.use((req, res, next) => {
    if (EXCLUDED_PATHS.includes(req.path)) return next();
    express.json({ limit: DATA_LIMIT_BYTES })(req, res, (err) => {
      if (err) return next(err);
      express.urlencoded({ extended: false, limit: DATA_LIMIT_BYTES })(
        req,
        res,
        next
      );
    });
  });

  // Raw parser + manual truncation for excluded routes
  const rawBodyParser = express.raw({
    type: RAW_BODY_TYPE,
    limit: RAW_BODY_LIMIT_BYTES,
  });
  app.use((req, res, next) => {
    if (!EXCLUDED_PATHS.includes(req.path)) return next();
    rawBodyParser(req, res, (err) => {
      if (err) return next(err);
      try {
        const raw = req.body.toString(FALLBACK_ENCODING);
        const truncated = raw.slice(0, DATA_LIMIT_BYTES);
        req.body = JSON.parse(truncated);
      } catch (e) {
        req.body = FALLBACK_BODY; // Fallback on parse failure
      }
      next();
    });
  });

  app.use(hbs);

  // Setup logging
  app.use(logEvent, morganInfo, morganWarn, morganError, loggingMiddleware);

  app.use(authCheck);

  // Setup handlebars
  app.use(baseContext);

  // Setup production environment
  if (process.env.NODE_ENV === "production") {
    app.use(applyProductionSecurity);
  }

  // app.use(express.json({ limit: "4kb" }));
  // app.use(bodyParser.urlencoded({ extended: false, limit: "4kb" }));
  app.use(compression());
  app.use(validateRequestIntegrity);
  app.use(formatHtml);
  app.use(routes);
  app.use(errorHandler);
  return app;
}

module.exports = setupApp;
