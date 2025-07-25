const UNCUGHT_EXCEPTION_MSG = "Uncaught Exception:";
const UNHANDLED_REJECTION_MSG = "Unhandled Rejection:";

const { winstonLogger } = require("./index");

function handleUncaughtException(err) {
  const msg = err.stack || err;
  try {
    console.error(UNCUGHT_EXCEPTION_MSG, msg);
    winstonLogger.error(UNCUGHT_EXCEPTION_MSG, msg);
  } catch (e) {
    console.error(UNCUGHT_EXCEPTION_MSG, msg);
  }
}

function handleUnhandledRejection(reason) {
  const msg = reason?.stack || reason;
  try {
    console.error(UNHANDLED_REJECTION_MSG, msg);
    winstonLogger.error(UNHANDLED_REJECTION_MSG, msg);
  } catch (e) {
    console.error(UNHANDLED_REJECTION_MSG, msg);
  }
}

module.exports = {
  handleUncaughtException,
  handleUnhandledRejection,
};
