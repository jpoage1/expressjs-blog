const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");
const os = require("os");
const { PathNotFoundError } = require("#errors");
const { validatePath, validateExplicitPath } = require("#utils/validation.js");

const { fallbacks } = require("./defaults");

/**
 * Validates and resolves an explicit configuration path.
 * @param {string} rawPath - The raw path string from CLI or ENV.
 * @param {string} sourceName - The name of the source for error reporting.
 * @returns {{ path: string, isExplicit: true }}
 * @throws {Error} If the path does not exist.
 */

/**
 * Resolves the configuration file path based on priority.
 * Fallbacks include XDG standard paths and hidden home directory files.
 * @returns {{ path: string, isExplicit: boolean }}
 */
function resolveConfigPath(rootDir = fallbacks.roodDir) {
  // 1. CLI Argument Priority
  const cliPath = getCliArgument("--config");
  if (cliPath) return validateExplicitPath(cliPath, "CLI");

  // 2. Environment Variable Priority
  const envPath = process.env.CONFIG_PATH;
  if (envPath) return validateExplicitPath(envPath, "ENV");

  // 3. Implicit Fallbacks
  const implicitPath = getFirstExistingPath(
    fallbacks.contentPaths,
    fallbacks.rootDir,
  );

  if (!implicitPath) {
    console.log(
      `No configuration found in searched paths: ${JSON.stringify(fallbacks.configPaths)}. Using defaults.`,
    );
  }

  return { path: implicitPath, isExplicit: false };
}

/**
 * Extracts value from CLI arguments.
 */
function getCliArgument(flag) {
  const index = process.argv.indexOf(flag);
  const hasNextValue = index !== -1 && process.argv[index + 1];
  return hasNextValue ? process.argv[index + 1] : null;
}

/**
 * Returns the first path in an array that exists on the filesystem.
 */

function getFirstExistingPath(paths, rootDir = fallbacks.roodDir) {
  for (const p of paths) {
    const resolvedPath = path.resolve(p);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  return null;
}

function logError(key) {
  const toEnvVar = (key) => key.replace(/([A-Z])/g, "_$1").toUpperCase();

  const toConfigKey = (key) => key.replace(/([A-Z])/g, "_$1").toLowerCase();

  console.log(
    `Notice: ${key} is not set. Use env var ${toEnvVar(key)} or config key ${toConfigKey(key)}`,
  );
}

module.exports = {
  resolveConfigPath,
  getCliArgument,
  getFirstExistingPath,
  logError,
};
