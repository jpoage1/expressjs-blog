// src/utils/logging/index.js

const { patchConsole, writeLog } = require("./consolePatch");
const { functionLog } = require("./functionLogger");

const { sessionTimestamp, sessionDir } = require("../../config/logging");

const { logStreams, sessionTransport } = require("./config.js");
// patchConsole(logStreams, sessionTransport);

// Not used, but good for debugging without winston as a dependency
const manualLogger = {
  streams: logStreams,
  function: (...args) => functionLog(functionsLogDir, ...args),
  info: (...args) =>
    writeLog("INFO", logStreams.info, sessionTransport, console.log, ...args),
  event: (...args) =>
    writeLog("EVENT", logStreams.event, sessionTransport, console.log, ...args),
  notice: (...args) =>
    writeLog(
      "NOTICE",
      logStreams.notice,
      sessionTransport,
      console.log,
      ...args,
    ),
  warn: (...args) =>
    writeLog("WARN", logStreams.warn, sessionTransport, console.warn, ...args),
  security: (...args) =>
    writeLog(
      "SECURITY",
      logStreams.security,
      sessionTransport,
      console.warn,
      ...args,
    ),
  error: (...args) =>
    writeLog(
      "ERROR",
      logStreams.error,
      sessionTransport,
      console.error,
      ...args,
    ),
  debug: (...args) =>
    writeLog(
      "DEBUG",
      logStreams.debug,
      sessionTransport,
      console.debug,
      ...args,
    ),
  analytics: (...args) =>
    writeLog("ANALYTICS", logStreams.analytics, sessionTransport, ...args),
  sessionInfo: () => ({
    sessionId: sessionTimestamp,
    sessionDir,
    startTime: new Date().toISOString(),
  }),
};
module.exports = {
  manualLogger,
};
