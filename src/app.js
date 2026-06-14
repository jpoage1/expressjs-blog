// src/app.js
require("dotenv").config();

const { public: p, network: c, meta } = require("#config");

const net = require("net");
const setupMiddleware = require("#middleware");
const {
  LogBuffer,
  handleUncaughtException,
  handleUnhandledRejection,
} = require("#logging");
const {
  formatMethodString,
  formatRoutesToBuffer,
} = require("#utils/formatting.js");

const { cleanupOldSessions } = require("#utils/logManager.js");
const { getExpress5Routes } = require("@jpoage1/middleware");

cleanupOldSessions();

class App {
  constructor(app, logger = console) {
    this.startupBuffer = new LogBuffer(logger, "info", { raw: true });
    this.app = app;
    this.server = net.createServer();
  }
  wrapFatalHandler = (handler) => (err) => {
    console.log(err);
    this.startupBuffer.flush();
    handler(err);
  };
  handleError() {
    this.server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        this.startupBuffer.flush();
        logger.error(`Port ${c.port} is already in use.`);
        process.exit(1);
      } else {
        this.startupBuffer.flush();
        throw err;
      }
    });
  }
}

server.once("listening", () => {
  server.close();

  this.startupBuffer.push("==================================================");
  this.startupBuffer.push("API SERVER CONFIGURATION");
  this.startupBuffer.push("==================================================");
  this.startupBuffer.push(
    `[*] Domain Endpoint: ${p.schema}://${p.domain}:${p.port}`,
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

process.on("uncaughtException", this.wrapFatalHandler(handleUncaughtException));
process.on(
  "unhandledRejection",
  this.wrapFatalHandler(handleUnhandledRejection),
);

module.exports = { getExpress5Routes, formatRoutesToBuffer, startupBuffer };
