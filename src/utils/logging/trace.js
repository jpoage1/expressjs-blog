const fs = require("fs");
const path = require("path");

const logStream = fs.createWriteStream(
  path.join(__dirname, "../../trace.log"),
  { flags: "a" },
);

function trace(label, operation) {
  const start = performance.now();

  // If operation is a promise, handle accordingly
  if (operation instanceof Promise) {
    return operation.finally(() => {
      const duration = (performance.now() - start).toFixed(4);
      logStream.write(`[TRACE] ${label}: ${duration}ms\n`);
    });
  }

  // Synchronous execution
  const result = operation();
  const duration = (performance.now() - start).toFixed(4);
  logStream.write(`[TRACE] ${label}: ${duration}ms\n`);
  return result;
}

module.exports = { trace };
