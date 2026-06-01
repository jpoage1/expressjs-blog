const config = require("#config");
const { include } = config;

function loadRoutes() {
  try {
    const routesModule = include("routes");
    const VALID_KEYS = [
      "constructionRoutes",
      "markdownRoutes",
      "htmlRoutes",
      "projects",
      "router",
    ];

    if (typeof routesModule === "function") {
      config.routes = routesModule.bind(config);
    } else if (routesModule && typeof routesModule === "object") {
      const invalid = Object.keys(routesModule).filter(
        (k) => !VALID_KEYS.includes(k),
      );
      if (invalid.length > 0) {
        throw new Error(
          `[config] Invalid keys in routes module: ${invalid.join(", ")}`,
        );
      }
      config.routes = routesModule;
    } else {
      throw new Error(
        `[config] routes module must export a function or plain object, got ${typeof routesModule}`,
      );
    }
  } catch (err) {
    // Route errors are fatal — the app cannot serve pages without them
    console.error("[config] Route configuration error:", err.message);
    if (err.cause) console.error("Caused by:", err.cause.stack);
    process.exit(1);
  }
  return config.routes;
}
loadRoutes();

module.exports = loadRoutes();
