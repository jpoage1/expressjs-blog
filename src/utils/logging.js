// utils/logging.js
const fs = require("fs");
const path = require("path");
const util = require("util");

// Define the root log directory
const logDir = path.join(__dirname, "..", "..", "logs");
const projectRoot = path.join(__dirname, "..", "..");

// Define log file paths
const logFiles = {
  session: path.join(logDir, "session.log"),
  info: path.join(logDir, "info", "info.log"),
  notice: path.join(logDir, "notice", "notice.log"),
  error: path.join(logDir, "error", "error.log"),
  warn: path.join(logDir, "warn", "warning.log"),
  debug: path.join(logDir, "debug", "debug.log"),
};

// Ensure log directories exist
Object.values(logFiles).forEach((filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const functionsLogDir = path.join(logDir, "functions");
if (!fs.existsSync(functionsLogDir)) {
  fs.mkdirSync(functionsLogDir, { recursive: true });
}

const originalConsole = { ...console };

// Create write streams
const logStreams = {
  session: fs.createWriteStream(logFiles.session, { flags: "a" }),
  info: fs.createWriteStream(logFiles.info, { flags: "a" }),
  notice: fs.createWriteStream(logFiles.notice, { flags: "a" }),
  error: fs.createWriteStream(logFiles.error, { flags: "a" }),
  warn: fs.createWriteStream(logFiles.warn, { flags: "a" }),
  debug: fs.createWriteStream(logFiles.debug, { flags: "a" }),
};

// Utility function for custom function logs
const dynamicCustomStreams = {};

function formatFunctionName(rawPath) {
  const relative = path.relative(projectRoot, rawPath).replace(/\\/g, "/");
  return relative;
}

function formatLogMessage(functionName, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${args.join(" ")}\n`;
}
const functionLog = (functionName, ...args) => {
  const safeFunctionName = formatFunctionName(functionName).replace(
    /[^a-z0-9_\-]/gi,
    "_"
  );
  const message = formatLogMessage(functionName, args);

  if (!dynamicCustomStreams[safeFunctionName]) {
    const customFilePath = path.join(
      functionsLogDir,
      `${safeFunctionName}.log`
    );
    dynamicCustomStreams[safeFunctionName] = fs.createWriteStream(
      customFilePath,
      { flags: "a" }
    );
  }

  dynamicCustomStreams[safeFunctionName].write(message);
  //console.log(`[${functionName}]`, ...args)
};

// Generic log writer
function writeLog(level, stream, consoleFn, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  stream.write(logLine);
  logStreams.session.write(logLine);
  consoleFn(`[${timestamp}] [${level}]`, ...args);
}
function patchConsole() {
  console.log = (...args) =>
    writeLog("INFO", logStreams.info, originalConsole.log, ...args);
  console.error = (...args) =>
    writeLog("ERROR", logStreams.error, originalConsole.error, ...args);
  console.warn = (...args) =>
    writeLog("WARN", logStreams.warn, originalConsole.warn, ...args);
  console.info = (...args) =>
    writeLog("INFO", logStreams.info, originalConsole.info, ...args);
  console.debug = (...args) =>
    writeLog("DEBUG", logStreams.debug, originalConsole.debug, ...args);
}

// Exported logger object
const logger = {
  streams: logStreams,
  function: functionLog,
  info: (...args) => writeLog("INFO", logStreams.info, console.log, ...args),
  notice: (...args) =>
    writeLog("NOTICE", logStreams.notice, console.log, ...args),
  warn: (...args) => writeLog("WARN", logStreams.warn, console.warn, ...args),
  error: (...args) =>
    writeLog("ERROR", logStreams.error, console.error, ...args),
  debug: (...args) =>
    writeLog("DEBUG", logStreams.debug, console.debug, ...args),
};
if (process.env.NODE_ENV !== "production") {
  patchConsole();
}
module.exports = logger;
