// src/logging/winston.js

const { format } = require("winston");

const callSiteFormat = format((info) => {
  const err = new Error();
  console.log(err.stack);
  const lines = err.stack.split("\n");
  // keep only frames that are in our source, not internals or node_modules
  const frame = lines.find((line, i) => {
    if (i === 0) return false;
    return (
      line.includes("    at ") &&
      !/node_modules/.test(line) &&
      !/node:internal/.test(line)
    );
  });
  if (frame) {
    const match = frame.match(/\((.+)\)/) || frame.match(/at (.+)/);
    if (match) {
      info.callSite = match[1].replace(process.cwd() + "/", "").trim();
    }
  }
  return info;
})();

function getCallSite() {
  const err = new Error();
  const lines = err.stack.split("\n");
  // lines[0] = "Error"
  // lines[1..N] = frames inside consolePatch/manualLogger/logger.js
  // We want the first frame NOT in src/utils/logging/
  const frame = lines.find((line, i) => {
    if (i === 0) return false;
    return (
      line.includes("    at ") &&
      !line.includes("/src/utils/logging/") &&
      !line.includes("/node_modules/")
    );
  });
  if (!frame) return "unknown";
  // Extract "src/routes/index.js:42:15" relative to project root
  const match = frame.match(/\((.+)\)/) || frame.match(/at (.+)/);
  if (!match) return "unknown";
  return match[1]
    .replace(process.cwd() + "/", "") // make it relative
    .trim();
}

module.exports = {
  callSiteFormat,
  getCallSite,
};
