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
const BaseContext = require("../utils/baseContext");
const { withBasePath } = require("./withBasePath");
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
const authConfig = require("./authConfig");
const debugMiddleware = require("./debug");
const trace = require("./trace");
const { meta, session } = require("../config/loader");
const { auth, requiresAuth } = require("express-openid-connect");

function setupApp(config) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);
  app.use(adaptiveBodyParser);

  app.use(hbs);
  // Setup logging
  app.use(httpLogger, loggingMiddleware);

  app.use(authConfig);
  app.use(authCheck);

  app.use(debugMiddleware);

  // Setup handlebars
  app.use(BaseContext);
  // app.use(attachBaseContextGetter, buildBaseContext);

  // Setup production environment
  if (meta.node_env === "production" || meta.node_env === "testing") {
    app.use(applyProductionSecurity);
  }

  app.use(compression());
  app.use(trace);
  app.use(validateRequestIntegrity);
  app.use(formatHtml);
  app.use(redirectMiddleware);
  app.use(cacheUtils);

  const router = express.Router();

  router.use((req, res, next) => {
    if (req.method === "HEAD") {
      req.method = "GET";
      res.removeHeader = res.removeHeader || function () {};
      // suppress body on the way out
      const originalSend = res.send.bind(res);
      res.send = (body) => originalSend("");
    }
    next();
  });

  router.post("/track", logEvent("analytics"), analytics);
  router.post("/analytics", logEvent("analytics"), analytics);
  router.use("/admin", logEvent("admin"), securedMiddleware, securedRoutes);
  // app.post(withBasePath("/track"), logEvent("analytics"), analytics);
  // app.post(withBasePath("/analytics"), logEvent("analytics"), analytics);
  // app.use(withBasePath("/admin"), logEvent("admin"), securedMiddleware, securedRoutes);
  router.use(logEvent("public"), routes);

  router.use(errorHandler);

  return app.use(withBasePath, router);
}

module.exports = setupApp;
