const router = require("express").Router();
const fs = require("fs");

const excludeIps = new Set(["192.168.1.50", "73.19.173.54"]);

// Use this function to flatten the Express router stack
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

// Collect excludeRoutes from Express router layers
function getExcludeRoutes(router) {
  const rootStack = router.stack;
  const flat = flattenRouterLayers(rootStack);
  const routes = [];
  for (const l of flat) {
    if (l.route && l.route.path) {
      routes.push(l.route.path);
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

function parseLogLine(line) {
  const parts = line.split(" ");
  if (parts.length < 1) return null;
  const ip = parts[0];

  const match = line.match(/"([^"]*)"/);
  if (!match) return null;

  const request = match[1].split(" ");
  if (request.length < 2) return null;

  return { ip, url: request[1] };
}

// Route that returns filtered logs as plaintext
router.get("/filtered-logs", (req, res) => {
  const excludeRoutes = getExcludeRoutes(req.app._router);
  const logPath = "/var/log/nginx/access.log";

  try {
    const input = fs.readFileSync(logPath, "utf8");
    const lines = input.split("\n");
    const filtered = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseLogLine(line);
      if (!parsed) continue;

      if (!shouldExclude(parsed.ip, parsed.url, excludeRoutes)) {
        filtered.push(line);
      }
    }

    res.type("text/plain").status(200).send(filtered.join("\n"));
  } catch {
    res.sendStatus(500);
  }
});
