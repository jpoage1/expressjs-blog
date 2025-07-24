// src/app.js
require("dotenv").config();

const net = require("net");
const setupMiddleware = require("./middleware");
const { winstonLogger } = require("./utils/logging");

const { startTokenCleanup } = require("./utils/tokenCleanup");

const SERVER_PORT = process.env.TEST_PORT || process.env.SERVER_PORT || 3400;
const SERVER_LISTEN_LOG = (port) =>
  `Server listening on http://localhost:${port}`;
const NODE_ENV_LOG = `NODE_ENV: ${process.env.NODE_ENV}`;
const UNCUGHT_EXCEPTION_MSG = "Uncaught Exception:";
const UNHANDLED_REJECTION_MSG = "Unhandled Rejection:";

function handleUncaughtException(err) {
  winstonLogger.error(UNCUGHT_EXCEPTION_MSG, err.stack || err);
}

function handleUnhandledRejection(reason) {
  winstonLogger.error(UNHANDLED_REJECTION_MSG, reason?.stack || reason);
}

startTokenCleanup();

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
