// src/middleware/routesList.js
let cachedRoutes = null;
let cachedApp = null;

function getAllRoutePaths(app) {
  const paths = new Set();

  function extractPaths(stack, basePath = "") {
    if (!stack) return;

    stack.forEach((layer) => {
      if (layer.route) {
        // Direct route
        paths.add(basePath + layer.route.path);
      } else if (
        layer.name === "router" &&
        layer.handle &&
        layer.handle.stack
      ) {
        // Router middleware - try to extract base path
        let routerPath = "";

        // Try to extract path from regexp
        if (layer.regexp && layer.regexp.source) {
          const match = layer.regexp.source.match(/^\^\\?\/?([^\\$?]+)/);
          if (match && match[1]) {
            routerPath = "/" + match[1].replace(/\\\//g, "/");
          }
        }

        extractPaths(layer.handle.stack, basePath + routerPath);
      }
    });
  }

  if (app && app._router && app._router.stack) {
    extractPaths(app._router.stack);
  }

  return Array.from(paths).sort();
}

// Middleware to capture the app instance
function routesList(req, res, next) {
  // Store app reference for later use
  if (!cachedApp && req.app) {
    cachedApp = req.app;
  }
  next();
}

// Function to get routes (called from the route handler)
function getRoutes() {
  if (!cachedApp) {
    return [];
  }

  // Cache routes on first access
  if (!cachedRoutes) {
    cachedRoutes = getAllRoutePaths(cachedApp);
  }

  return cachedRoutes;
}

// Force refresh of cached routes
function refreshRoutes() {
  cachedRoutes = null;
  if (cachedApp) {
    cachedRoutes = getAllRoutePaths(cachedApp);
  }
  return cachedRoutes || [];
}

module.exports = {
  routesList,
  getRoutes,
  refreshRoutes,
};
