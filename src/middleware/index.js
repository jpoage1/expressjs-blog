// src/setupMiddleware.js
const express = require("express");
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

const { TRUST_PROXY } = require("../constants/middlewareConstants");

const { loggingMiddleware } = require("./logging");
const securedMiddleware = require("./secured");
const securedRoutes = require("../routes/secured");
const adaptiveBodyParser = require("./adaptiveBodyParser");
const analytics = require("../controllers/analyticsControllers");
const httpLogger = require("../utils/structuredLogger");
const cacheUtils = require("./cacheUtils");

function setupApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);
  app.use(adaptiveBodyParser);

  app.use(hbs);

  // Setup logging
  app.use(httpLogger, loggingMiddleware);

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
  app.use(cacheUtils);
  app.post("/track", logEvent("analytics"), analytics);
  app.post("/analytics", logEvent("analytics"), analytics);
  app.use("/admin", logEvent("admin"), securedMiddleware, securedRoutes);
  app.use(logEvent("public"), routes);

  app.use(errorHandler);

  return app;
}

module.exports = setupApp;
