// src/app.js
console.log('CWD:', process.cwd());

require("dotenv").config();
const setupMiddleware = require("./middleware");

const { manualLogger } = require("./utils/logging");
// const path = require("path");

app = setupMiddleware();

port = process.env.PORT || 3400;

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});

process.on("uncaughtException", (err) => {
  manualLogger.error("Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, promise) => {
  manualLogger.error("Unhandled Rejection:", reason?.stack || reason);
});
