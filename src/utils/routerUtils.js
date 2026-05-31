/**
 * Determines if a given target is an Express router instance based on Express 5 structural conventions.
 * @param {any} target - The object or function to evaluate.
 * @returns {boolean}
 */
function isExpressRouter(target) {
  return !!(
    target &&
    typeof target === "function" &&
    Array.isArray(target.stack)
  );
}

/**
 * Extracts and normalizes HTTP methods from a route object.
 * @param {Object} route
 * @returns {string[]}
 */
function extractRouteMethods(route) {
  if (!route || !route.methods) return [];

  return Object.keys(route.methods)
    .filter((method) => route.methods[method])
    .map((method) => method.toUpperCase());
}

/**
 * Processes an individual layer within the router stack.
 * @param {Object} layer
 * @param {string} parentPath
 * @param {Set} visited
 * @returns {Object[]}
 */
function processLayer(layer, parentPath, visited) {
  if (!layer) return [];

  if (layer.route) {
    const path = `${parentPath}${layer.route.path || ""}`;
    const methods = extractRouteMethods(layer.route);
    return [{ path, methods }];
  }

  const isSubRouter =
    layer.name === "router" && layer.handle && isExpressRouter(layer.handle);
  if (isSubRouter) {
    const basePath = layer.path || "";
    return getExpress5Routes(
      layer.handle.stack,
      parentPath + basePath,
      visited,
    );
  }

  return [];
}

/**
 * Parses an Express 5 router stack to extract flat route definitions.
 * @param {Array} routerStack
 * @param {string} parentPath
 * @param {Set} visited - Tracking set to prevent memory overflows from circular references.
 * @returns {Object[]}
 */
function getExpress5Routes(routerStack, parentPath = "", visited = new Set()) {
  if (!Array.isArray(routerStack) || visited.has(routerStack)) {
    return [];
  }

  // Track stack reference to isolate boundary edge cases (circular routing)
  visited.add(routerStack);
  let routes = [];

  for (const layer of routerStack) {
    const layerRoutes = processLayer(layer, parentPath, visited);
    routes = routes.concat(layerRoutes);
  }

  return routes;
}

module.exports = {
  isExpressRouter,
  extractRouteMethods,
  processLayer,
  getExpress5Routes,
};
