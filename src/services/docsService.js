const fs = require("fs/promises");
const path = require("path");
const yaml = require("js-yaml");
const { winstonLogger } = require("../utils/logging");

const docsDir = path.join(__dirname, "../../content/docs");
const docsCache = {}; // { [path]: { modules: {}, crossCuttingSummary: {} } }

async function loadDocFile(filePath) {
  if (docsCache[filePath]) return docsCache[filePath];
  try {
    const fullPath = path.join(docsDir, filePath + ".yaml");
    const fileContent = await fs.readFile(fullPath, "utf-8");
    const parsed = yaml.load(fileContent);
    const crossCuttingSummary = parsed["Cross Cutting Summary"] || null;
    docsCache[filePath] = {
      modules: parsed,
      crossCuttingSummary,
    };
    return docsCache[filePath];
  } catch (e) {
    winstonLogger.error(e.stack);
    return null;
  }
}

function filterModuleSecurityKeys(moduleDoc) {
  if (!moduleDoc || typeof moduleDoc !== "object") return moduleDoc;
  const { securityAndStability, ...moduleWithoutSecurity } = moduleDoc;
  return moduleWithoutSecurity;
}

async function getYamlFileNames() {
  const files = await fs.readdir(docsDir);
  return files.filter((f) => f.endsWith(".yaml")).map((f) => f.slice(0, -5));
}

module.exports = {
  docsDir,
  loadDocFile,
  filterModuleSecurityKeys,
  getYamlFileNames,
};
