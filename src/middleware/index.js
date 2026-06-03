const express = require("express");
const compression = require("compression");
const { TRUST_PROXY } = require("#constants/middlewareConstants.js");

// ── Wiring files ──────────────────────────────────────────────────────────────
const { logger } = require("#logging");
const {
  httpLogger,
  analyticsController,
  visitorService,
} = require("#analytics");
const {
  applyProductionSecurity,
  blocklist,
  validateRequestIntegrity,
  xssSanitizer,
  SecurityEvent,
} = require("#security");
const { hbs, baseContextMiddleware, applyHbsToApp } = require("#base-context");

// ── Package imports ───────────────────────────────────────────────────────────
const {
  createOidcMiddleware,
  createAuthCheck,
  startTokenCleanup,
} = require("@jpoage1/auth");
const {
  createRedirectMiddleware,
  createAdaptiveBodyParser,
  createErrorHandler,
  csrfToken,
  trace,
  cacheUtils,
} = require("@jpoage1/middleware");

// ── Blog-specific middleware ──────────────────────────────────────────────────
const routes = require("../routes");
const securedMiddleware = require("./secured");
const securedRoutes = require("#routes/secured.js");
const logEvent = require("./analytics.js");
const authCheck = require("./authCheck");
const authConfig = require("./authConfig");
const debugMiddleware = require("./debug");
const { loggingMiddleware } = require("./logging");

const config = require("#config");
const { meta } = config;

function setupApp() {
  const app = express();

  startTokenCleanup(5 * 60 * 1000, logger);

  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);

  // Register handlebars engine
  applyHbsToApp(app, hbs, [require("path").join(__dirname, "../views")]);

  // ── Middleware stack ──────────────────────────────────────────────────────
  app.use(blocklist.middleware);

  const bodyParser = createAdaptiveBodyParser({ logger });
  app.use(bodyParser);

  app.use(httpLogger, loggingMiddleware);

  app.use(authConfig);
  app.use(authCheck);
  app.use(debugMiddleware);
  app.use(baseContextMiddleware);

  if (meta.node_env === "production" || meta.node_env === "testing") {
    app.use(xssSanitizer, ...applyProductionSecurity);
  }

  app.use(compression());
  app.use(trace);
  app.use(validateRequestIntegrity);

  const redirectMiddleware = createRedirectMiddleware({
    logger,
    redirects: config.redirects || {},
  });
  app.use(redirectMiddleware);
  app.use(cacheUtils);

  // ── Router ────────────────────────────────────────────────────────────────
  const router = express.Router();

  router.use((req, res, next) => {
    if (req.method === "HEAD") {
      req.method = "GET";
      const originalSend = res.send.bind(res);
      res.send = (body) => originalSend("");
    }
    next();
  });

  const analytics = analyticsController("analytics");
  router.post("/track", logEvent("analytics"), analytics);
  router.post("/analytics", logEvent("analytics"), analytics);
  router.use("/admin", logEvent("admin"), securedMiddleware, securedRoutes);
  router.use(logEvent("public"), routes);

  const errorHandler = createErrorHandler({
    logger,
    isProd: meta.node_env === "production",
  });
  router.use(errorHandler);

  return app.use(router);
}

module.exports = setupApp;
