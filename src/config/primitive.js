const fs = require("fs");
const path = require("path");
const convict = require("convict");

const { parse } = require("smol-toml");

const schema = require("./schema.cjs");

const configFilePath = resolveConfigPath();

class Config {
  _toml = {};
  _env = {};
  constructor(configFilePath) {
    this._toml = this.loadToml(configFilePath);
    this._env = process.env;
  }
  loadToml(configFilePath) {
    const raw = fs.readFileSync(path.resolve(configFilePath), "utf8");
    if (configFilePath) {
      try {
        const raw = fs.readFileSync(path.resolve(configFilePath), "utf8");
        const toml = parse(raw);
        // convict.load() does a deep merge — env vars applied after still win
        cfg.load(toml);
      } catch (err) {
        console.error(
          `[config] Failed to load ${configFilePath}: ${err.message}`,
        );
        // Non-fatal: fall through to defaults + env
      }
    } else {
      console.log(
        "[config] No config.toml found. Using defaults and environment variables.",
      );
    }
  }
  getPrimitive(key) {
    return this._env[key] ?? this._toml[key];
  }
}

// function getProperty(name) {
//   return process.env[name] ?
// }

// }
