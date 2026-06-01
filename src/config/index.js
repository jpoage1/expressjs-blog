const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");
const defaults = require("./defaults");
const { PrimitiveError } = require("#utils/primitiveErrors.js");

class Config {
  constructor() {
    this.data = {};
    this.setup();

    return new Proxy(this, {
      get: (target, prop) => {
        // Prioritize class methods (like .get)
        if (prop in target) {
          return target[prop];
        }
        // Fallback to merged data for direct traversal
        return target.data[prop];
      },
    });
  }

  setup() {
    const toml = this.loadToml();
    const merged = this.deepMerge(defaults, toml);
    this.data = this.applyEnv(merged);

    this.resolvePaths(this.data);

    this.validate(this.data);
    this.injectAliases(this.data);
    this.injectHelpers(this.data);
  }
  resolvePaths(data) {
    const root = data.meta?.root_dir;
    const log = data.logging?.log_dir;

    if (root && log && !path.isAbsolute(log)) {
      // Resolves "logs/" to "/srv/projects/.../logs"
      data.logging.log_dir = path.resolve(root, log);
    }
  }
  validate(data) {
    if (!data.logging?.log_dir) {
      console.log(data);
      throw new PrimitiveError("Log dir is undefined");
    }
  }
  injectHelpers(data) {
    data.logging.getDBFile = (file) => path.join(data.logging.db_path, file);
  }

  get(keyPath) {
    return keyPath.split(".").reduce((prev, curr) => prev?.[curr], this.data);
  }

  loadToml() {
    const flag = process.argv.indexOf("--config");
    const target = flag !== -1 ? process.argv[flag + 1] : "config.toml";

    try {
      return parse(fs.readFileSync(path.resolve(target), "utf8"));
    } catch {
      return {};
    }
  }

  deepMerge(target, source) {
    const output = { ...target };

    Object.keys(source).forEach((key) => {
      this.processMerge(output, source, key);
    });

    return output;
  }

  processMerge(output, source, key) {
    const isObj = (val) =>
      val && typeof val === "object" && !Array.isArray(val);

    if (isObj(source[key]) && isObj(output[key])) {
      output[key] = this.deepMerge(output[key], source[key]);
      return;
    }
    output[key] = source[key];
  }

  applyEnv(obj, prefix = "") {
    const result = { ...obj };

    Object.keys(result).forEach((key) => {
      const envKey = (prefix + key).toUpperCase();

      if (process.env[envKey]) {
        result[key] = process.env[envKey];
      }

      if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = this.applyEnv(result[key], `${envKey}_`);
      }
    });

    return result;
  }
  injectAliases(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

    Object.keys(obj).forEach((key) => {
      // 1. Recurse into nested objects
      if (typeof obj[key] === "object") {
        this.injectAliases(obj[key]);
      }

      // 2. Check if key is snake_case (contains underscore)
      if (key.includes("_")) {
        const alias = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());

        // 3. Define the getter if the alias doesn't already exist
        if (!(alias in obj)) {
          Object.defineProperty(obj, alias, {
            get() {
              return this[key];
            },
            enumerable: false, // Hidden from loops/JSON.stringify
            configurable: true,
          });
        }
      }
    });
  }
}

module.exports = new Config();
