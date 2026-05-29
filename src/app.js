// src/app.js
require("dotenv").config();

const { network: c, meta } = require("./config/loader");

const net = require("net");
const setupMiddleware = require("./middleware");
const {
  handleUncaughtException,
  handleUnhandledRejection,
} = require("./utils/logging/handlers");
const { winstonLogger } = require("./utils/logging");
const LogBuffer = require("./utils/logging/LogBuffer.js");

const { startTokenCleanup } = require("./utils/tokenCleanup");
const { cleanupOldSessions } = require("./utils/logManager");

const startupBuffer = new LogBuffer(winstonLogger, "info");

/**
 * Extracts and flattens all registered routes from an Express 5 router stack.
 */
function getExpress5Routes(routerStack, parentPath = "") {
  let routes = [];

  routerStack.forEach((layer) => {
    if (layer.route) {
      const path = `${parentPath}${layer.route.path}`;
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method])
        .map((method) => method.toUpperCase());

      routes.push({ path, methods });
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      const basePath = layer.path || "";
      const nestedRoutes = getExpress5Routes(
        layer.handle.stack,
        parentPath + basePath,
      );
      routes = routes.concat(nestedRoutes);
    }
  });

  return routes;
}

/**
 * Centers and pads a method array string to fit a fixed 10-character column width.
 */
function formatMethodString(methods) {
  const methodString = methods.join(", ");
  const totalWidth = 10;
  const leftPadding = Math.floor((totalWidth - methodString.length) / 2);
  const rightPadding = totalWidth - methodString.length - leftPadding;

  return " ".repeat(leftPadding) + methodString + " ".repeat(rightPadding);
}

/**
 * Formats and maps collected routes directly into the designated LogBuffer.
 */
function formatRoutesToBuffer(routes, buffer) {
  routes.forEach(({ methods, path }) => {
    const paddedMethods = formatMethodString(methods);
    buffer.push(`[${paddedMethods}] |      API      | ${path}`);
  });
}

cleanupOldSessions();
startTokenCleanup();

const app = setupMiddleware();

const server = net.createServer();
server.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    startupBuffer.flush();
    winstonLogger.error(`Port ${c.port} is already in use.`);
    process.exit(1);
  } else {
    startupBuffer.flush();
    throw err;
  }
});

server.once("listening", () => {
  server.close();

  startupBuffer.push("==================================================");
  startupBuffer.push("API SERVER CONFIGURATION");
  startupBuffer.push("==================================================");
  startupBuffer.push(
    `[*] Domain Endpoint: ${c.schema}://${c.domain}:${c.port}`,
  );
  startupBuffer.push(
    `[*] Local Interface: ${c.schema}://${c.address}:${c.port}`,
  );
  startupBuffer.push(`[*] NODE_ENV: ${meta.node_env}`);

  if (app.router && app.router.stack) {
    const allRoutes = getExpress5Routes(app.router.stack);
    formatRoutesToBuffer(allRoutes, startupBuffer);
  } else {
    startupBuffer.push(
      "Express router implementation has changed. Route information is currently unavailable.",
    );
  }

  startupBuffer.push("==================================================");

  app.listen(c.port, () => {
    startupBuffer.flush();
  });
});

server.listen(c.port);

const wrapFatalHandler = (handler) => (err) => {
  startupBuffer.flush();
  handler(err);
};

process.on("uncaughtException", wrapFatalHandler(handleUncaughtException));
process.on("unhandledRejection", wrapFatalHandler(handleUnhandledRejection));

module.exports = { getExpress5Routes, formatRoutesToBuffer, startupBuffer };
