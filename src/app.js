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

const { startTokenCleanup } = require("./utils/tokenCleanup");
const { cleanupOldSessions } = require("./utils/logManager");

cleanupOldSessions();
startTokenCleanup();

const app = setupMiddleware();

const server = net.createServer();
server.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    winstonLogger.error(`Port ${c.port} is already in use.`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.once("listening", () => {
  server.close();

  app.listen(c.port, () => {
    winstonLogger.info(
      `Server listening on ${c.schema}://${c.domain}:${c.port}`,
    );
    winstonLogger.info(`NODE_ENV: ${meta.node_env}`);
  });
});

server.listen(c.port);

process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);
