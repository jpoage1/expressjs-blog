// src/app.js
require("dotenv").config();

const net = require("net");
const setupMiddleware = require("./middleware");
const {
  handleUncaughtException,
  handleUnhandledRejection,
} = require("./utils/logging/handlers");
const { winstonLogger } = require("./utils/logging");

const { startTokenCleanup } = require("./utils/tokenCleanup");
const { cleanupOldSessions } = require("./utils/logManager");

const SERVER_PORT = process.env.SERVER_PORT || 3400;
const SERVER_LISTEN_LOG = (port) =>
  `Server listening on http://localhost:${port}`;
const NODE_ENV_LOG = `NODE_ENV: ${process.env.NODE_ENV}`;

cleanupOldSessions();
startTokenCleanup();

// const winstonLogger = createWinstonLogger();

const app = setupMiddleware();

const server = net.createServer();
server.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    winstonLogger.error(`Port ${SERVER_PORT} is already in use.`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.once("listening", () => {
  server.close();

  app.listen(SERVER_PORT, () => {
    winstonLogger.info(SERVER_LISTEN_LOG(SERVER_PORT));
    winstonLogger.info(NODE_ENV_LOG);
  });
});

server.listen(SERVER_PORT);

process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);
