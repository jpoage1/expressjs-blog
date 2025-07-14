// src/app.js
require("dotenv").config();

const setupMiddleware = require("./middleware");
const { manualLogger } = require("./utils/logging");
const { startTokenCleanup } = require("./utils/tokenCleanup");

const PORT = process.env.PORT || 3400;
const CWD_LOG = `CWD: ${process.cwd()}`;
const SERVER_LISTEN_LOG = (port) =>
  `Server listening on http://localhost:${port}`;
const NODE_ENV_LOG = `NODE_ENV: ${process.env.NODE_ENV}`;
const UNCUGHT_EXCEPTION_MSG = "Uncaught Exception:";
const UNHANDLED_REJECTION_MSG = "Unhandled Rejection:";

function handleUncaughtException(err) {
  manualLogger.error(UNCUGHT_EXCEPTION_MSG, err.stack || err);
}

function handleUnhandledRejection(reason) {
  manualLogger.error(UNHANDLED_REJECTION_MSG, reason?.stack || reason);
}

console.log(CWD_LOG);

startTokenCleanup();

const app = setupMiddleware();

app.listen(PORT, () => {
  console.log(SERVER_LISTEN_LOG(PORT));
  console.log(NODE_ENV_LOG);
});

process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);
