const excludeIps = new Set(["192.168.1.50", "73.19.173.54"]);

function flattenRouterLayers(stack, acc = []) {
  for (const layer of stack) {
    acc.push(layer);
    const h = layer.handle;
    if (typeof h === "function") {
      if (h.stack && Array.isArray(h.stack)) {
        flattenRouterLayers(h.stack, acc);
      } else if (h.handle && h.handle.stack && Array.isArray(h.handle.stack)) {
        flattenRouterLayers(h.handle.stack, acc);
      }
    }
  }
  return acc;
}

function getExcludeRoutes(router) {
  const rootStack = router.stack;
  const flat = flattenRouterLayers(rootStack);
  const routes = [];

  for (const layer of flat) {
    if (layer.route && layer.route.path) {
      routes.push(layer.route.path);
    }
  }

  return routes;
}

function shouldExclude(ip, url, excludeRoutes) {
  if (excludeIps.has(ip)) return true;

  for (const route of excludeRoutes) {
    if (
      route.includes(":token") ||
      route.includes(":year") ||
      route.includes(":month") ||
      route.includes(":name")
    ) {
      const routePrefix = route.split(":")[0];
      if (url.startsWith(routePrefix)) return true;
    } else {
      if (url === route || url.startsWith(route)) return true;
    }
  }

  return false;
}

module.exports = {
  getExcludeRoutes,
  shouldExclude,
};
