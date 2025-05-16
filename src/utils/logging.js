// utils/logging.js
const fs = require("fs");
const path = require("path");
const util = require("util");

// Define the root log directory
const logDir = path.join(__dirname, "..", "..", "logs");
const projectRoot = path.join(__dirname, "..", "..");

// Define log file paths
const logFiles = {
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

// Create write streams
const logStreams = {
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

// Exported logger object
const logger = {
  streams: logStreams,
  function: functionLog,
  info: (...args) => {
    const message = args.join(" ") + "\n";
    logger.streams.info.write(message);
    console.log("[INFO]", ...args);
  },
  function: functionLog,
  notice: (...args) => {
    const message = args.join(" ") + "\n";
    logger.streams.notice.write(message);
    console.log("[NOTICE]", ...args);
  },
  warn: (...args) => {
    const message = args.join(" ") + "\n";
    logger.streams.warn.write(message);
    console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    const message = args.join(" ") + "\n";
    logger.streams.error.write(message);
    console.error("[ERROR]", ...args);
  },
  debug: (message, ...args) => {
    let logMessage = message;
    // If the first argument is an object, use util.inspect to handle circular structures
    if (args.length > 0 && typeof args[0] === "object") {
      logMessage +=
        "\n" +
        util.inspect(args[0], { showHidden: false, depth: null, colors: true });
    } else {
      logMessage += " " + args.join(" ");
    }

    // Write to file (debug log file)
    logger.streams.debug.write(logMessage + "\n");

    // Log to the console (with [DEBUG] prefix)
    console.log("[DEBUG]", logMessage);
  },
};
module.exports = logger;
