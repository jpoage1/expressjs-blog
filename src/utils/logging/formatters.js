// formatters.js
const path = require("path");
const { projectRoot } = require("./config");

function formatFunctionName(rawPath, root = projectRoot) {
  return path.relative(root, rawPath).replace(/\\/g, "/");
}

function formatLogMessage(functionName, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${args.join(" ")}\n`;
}

module.exports = { formatFunctionName, formatLogMessage };
