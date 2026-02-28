const fs = require("fs");
const path = require("path");

const { logFiles } = require("../../config/logging");
const { logging } = require(".../../config/loader");
const { logDir } = logging;

function initializeLogDirectories(files = logFiles) {
  Object.values(files).forEach((filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const functionsLogDir = path.join(logDir, "functions");
  if (!fs.existsSync(functionsLogDir)) {
    fs.mkdirSync(functionsLogDir, { recursive: true });
  }
  return functionsLogDir;
}
module.exports = {
  initializeLogDirectories,
};
