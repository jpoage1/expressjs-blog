// src/utils/logging/callSite.js
const LOGGING_INTERNAL = /\/src\/utils\/logging\//;
const LOGGING_ERRORS = /\/src\/utils\/errors\//;
const NODE_INTERNAL = /node:internal/;
const NODE_MODULES = /node_modules/;

function getCallSite() {
  const lines = new Error().stack.split("\n");
  const frame = lines.find((line, i) => {
    if (i === 0) return false;
    return (
      line.includes("    at ") &&
      !LOGGING_INTERNAL.test(line) &&
      !LOGGING_ERRORS.test(line) &&
      !NODE_INTERNAL.test(line) &&
      !NODE_MODULES.test(line)
    );
  });
  if (!frame) return "unknown";
  const match = frame.match(/\((.+)\)/) || frame.match(/at (.+)/);
  if (!match) return "unknown";
  return match[1].replace(process.cwd() + "/", "").trim();
}

module.exports = { getCallSite };
