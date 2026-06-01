// formatters.js
const path = require("path");
const { meta } = require("#config");
const { root_dir } = meta;

function formatFunctionName(rawPath, root = root_dir) {
  return path.relative(root, rawPath).replace(/\\/g, "/");
}

function formatLogMessage(functionName, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${args.join(" ")}\n`;
}

module.exports = { formatFunctionName, formatLogMessage };
