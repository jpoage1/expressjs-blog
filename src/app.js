// src/app.js
require("dotenv").config();

const { network: c, meta } = require("#config");

const net = require("net");
const setupMiddleware = require("#middleware");
const {
  handleUncaughtException,
  handleUnhandledRejection,
} = require("#logging/handlers.js");
const { logger } = require("#logging");
const LogBuffer = require("#logging/LogBuffer.js");

const { startTokenCleanup } = require("#utils/tokenCleanup.js");
const { cleanupOldSessions } = require("#utils/logManager.js");
const { getExpress5Routes } = require("#utils/routerUtils.js");

const startupBuffer = new LogBuffer(logger, "info", { raw: true });

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
    logger.error(`Port ${c.port} is already in use.`);
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
