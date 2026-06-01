// src/middleware/index.js
// CHANGED: Added blocklist middleware (runs before body parsing) and
// blocklist.start() to begin periodic refresh from Postgres.
const express = require("express");
const compression = require("compression");

const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const { applyProductionSecurity } = require("./applyProductionSecurity");
const validateRequestIntegrity = require("./validateRequestIntegrity");
const errorHandler = require("./errorHandler");
const { attachBaseContextGetter, buildBaseContext } = require("./baseContext");
const BaseContext = require("#utils/baseContext.js");
const { withBasePath } = require("./withBasePath");
const hbs = require("./hbs");
const authCheck = require("./authCheck");
const { redirectMiddleware } = require("./redirect");

const { TRUST_PROXY } = require("#constants/middlewareConstants.js");

const { loggingMiddleware } = require("./logging");
const securedMiddleware = require("./secured");
const securedRoutes = require("#routes/secured.js");
const adaptiveBodyParser = require("./adaptiveBodyParser");
const analytics = require("#controllers/analyticsControllers.js");
const httpLogger = require("#utils/structuredLogger.js");
const cacheUtils = require("./cacheUtils");
const authConfig = require("./authConfig");
const debugMiddleware = require("./debug");
const trace = require("./trace");
const { meta, session } = require("#config");
const { auth, requiresAuth } = require("express-openid-connect");

// NEW: blocklist
const blocklist = require("#services/blocklist.js");
const blocklistMiddleware = require("./blocklist");

function setupApp(config) {
  const app = express();

  // Start the blocklist refresh cycle. Loads blocked IPs from Postgres
  // into an in-memory Set, refreshed every 5 minutes. If Postgres is
  // unreachable on boot, the set starts empty (fail-open).
  blocklist.start();

  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);

  // Blocklist runs first — before body parsing, before auth, before
  // anything. req.ip is available because trust proxy is set above.
  app.use(blocklistMiddleware);

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
  router.use(logEvent("public"), routes);

  router.use(errorHandler);

  return app.use(withBasePath, router);
}

module.exports = setupApp;
