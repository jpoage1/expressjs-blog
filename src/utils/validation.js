const path = require("path");
const fs = require("fs");
const { PathNotFoundError } = require("#errors");

function validatePath(rawPath, sourceName) {
  if (rawPath === undefined || rawPath === null) {
    throw new PathNotFoundError(sourceName, String(rawPath));
  }

  const resolved = path.resolve(rawPath);
  if (!fs.existsSync(resolved)) {
    throw new PathNotFoundError(sourceName, resolved);
  }
  return resolved;
}

function validateExplicitPath(rawPath, sourceName) {
  const path = validatePath(rawPath, sourceName);
  return { path, isExplicit: true };
}

module.exports = { validatePath, validateExplicitPath };
