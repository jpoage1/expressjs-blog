// src/analytics.js (blog)
const {
  createPool,
  createVisitorService,
  createRepeatDetector,
  createStructuredLogger,
  createAnalyticsController,
  createAnalyticsQueryService,
} = require("@jpoage1/analytics");
const { logger } = require("#logging");
const config = require("#config");

const { getPool, shutdown } = createPool(config.dbCredentials, logger);

const visitorService = createVisitorService(getPool);
const repeatDetector = createRepeatDetector();
const httpLogger = createStructuredLogger({
  visitorService,
  repeatDetector,
  logger,
});
const analyticsController = createAnalyticsController(visitorService, logger);
const analyticsQueryService = createAnalyticsQueryService(visitorService);

// Graceful shutdown in production
if (config.meta.node_env === "production") {
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

module.exports = {
  getPool,
  visitorService,
  httpLogger,
  analyticsController,
  analyticsQueryService,
};
