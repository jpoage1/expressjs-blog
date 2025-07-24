// src/setupMiddleware.js
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");

const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const { applyProductionSecurity } = require("./applyProductionSecurity");
const validateRequestIntegrity = require("./validateRequestIntegrity");
const errorHandler = require("./errorHandler");
const { attachBaseContextGetter, buildBaseContext } = require("./baseContext");
const hbs = require("./hbs");
const authCheck = require("./authCheck");
const { redirectMiddleware } = require("./redirect");
const { winstonLogger } = require("../utils/logging");

const {
  TRUST_PROXY,
  EXCLUDED_PATHS,
  DATA_LIMIT_BYTES,
  RAW_BODY_LIMIT_BYTES,
  RAW_BODY_TYPE,
  FALLBACK_ENCODING,
  FALLBACK_BODY,
} = require("../constants/middlewareConstants");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);

  // Body parsing with different limits for excluded vs normal paths
  app.use((req, res, next) => {
    const isExcludedPath = EXCLUDED_PATHS.includes(req.path);
    const limit = isExcludedPath ? RAW_BODY_LIMIT_BYTES : DATA_LIMIT_BYTES;

    const contentType = req.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Parse JSON with appropriate limit
      express.json({ limit })(req, res, (err) => {
        if (err) {
          winstonLogger.error("JSON parsing error:", err.message);
          return next(err);
        }
        // winstonLogger.debug("Parsed JSON body:", req.body);
        next();
      });
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form data with appropriate limit
      express.urlencoded({ extended: false, limit })(req, res, (err) => {
        if (err) {
          winstonLogger.error("Form parsing error:", err.message);
          return next(err);
        }
        // winstonLogger.debug("Parsed form body:", req.body);
        next();
      });
    } else if (contentType.includes("multipart/form-data")) {
      // For multipart, we'd need multer or similar, but pass through for now
      winstonLogger.debug(
        "Multipart form detected - may need additional handling"
      );
      next();
    } else {
      // Try form parsing first (most common for HTML forms), then JSON
      express.urlencoded({ extended: false, limit })(req, res, (formErr) => {
        if (formErr) {
          winstonLogger.warn(
            "Form parsing failed, trying JSON:",
            formErr.message
          );
          express.json({ limit })(req, res, (jsonErr) => {
            if (jsonErr) {
              winstonLogger.error("Both parsers failed:", {
                formErr: formErr.message,
                jsonErr: jsonErr.message,
              });
              return next(jsonErr);
            }
            // winstonLogger.warn("Parsed JSON body (fallback):", req.body);
            next();
          });
        } else {
          // winstonLogger.debug("Parsed form body (default):", req.body);
          next();
        }
      });
    }
  });

  app.use(hbs);

  // Setup logging
  app.use(logEvent, morganInfo, morganWarn, morganError, loggingMiddleware);

  app.use(authCheck);

  // Setup handlebars
  app.use(attachBaseContextGetter, buildBaseContext);

  // Setup production environment
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "testing"
  ) {
    app.use(applyProductionSecurity);
  }

  app.use(compression());
  app.use(validateRequestIntegrity);
  app.use(formatHtml);
  app.use(redirectMiddleware);
  app.use(routes);
  app.use(errorHandler);

  return app;
}

module.exports = setupApp;
