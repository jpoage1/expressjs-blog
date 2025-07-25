const fs = require("fs");
const path = require("path");

const { logDir, logFiles } = require("./config");

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
