// src/utils/logging/consolePatch.js
const { getCallSite } = require("#logging/callSite.js");

const originalConsole = { ...console };
let _logger = null;

function patchConsole(logger) {
  _logger = logger;

  const wrap =
    (level) =>
    (...args) => {
      const callSite = getCallSite();
      _logger[level](...args, { callSite });
    };

  console.log = wrap("info");
  console.info = wrap("info");
  console.warn = wrap("warn");
  console.error = wrap("error");
  console.debug = wrap("debug");

  return originalConsole;
}

function unpatchConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}

module.exports = { patchConsole, unpatchConsole };
