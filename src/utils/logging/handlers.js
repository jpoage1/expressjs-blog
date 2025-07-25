const UNCUGHT_EXCEPTION_MSG = "Uncaught Exception:";
const UNHANDLED_REJECTION_MSG = "Unhandled Rejection:";

const { winstonLogger } = require("./index");

function handleUncaughtException(err) {
  winstonLogger.error(UNCUGHT_EXCEPTION_MSG, err.stack || err);
}

function handleUnhandledRejection(reason) {
  winstonLogger.error(UNHANDLED_REJECTION_MSG, reason?.stack || reason);
}

module.exports = {
  handleUncaughtException,
  handleUnhandledRejection,
};
