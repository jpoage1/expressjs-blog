// test/units/utils/logging/config.test.js
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const proxyquire = require("proxyquire").noPreserveCache();

const {
  sessionTimestamp,
  sessionDir,
  logFiles,
} = require("../../../src/config/logging");
const config = require("../../../src/config");

describe("config.js", () => {
  it("config.meta.rootDir contains package.json", () => {
    const pkgJsonPath = path.join(config.meta.rootDir, "package.json");
    const exists = fs.existsSync(pkgJsonPath);
    expect(exists).to.equal(
      true,
      `package.json not found in ${config.meta.rootDir}`,
    );
  });

  it("config.meta.rootDir matches resolved 3-levels-up path", () => {
    const expected = path.resolve(__dirname, "../../../");
    expect(config.meta.rootDir).to.equal(expected);
  });

  it("config.logging.logDir is within config.meta.rootDir and ends with 'logs'", () => {
    const root = config.meta.rootDir;
    const log = config.logging.logDir;

    // Use a custom error message to display values on failure
    expect(
      log.startsWith(root),
      `Path Mismatch:\n  config.meta.rootDir: "${root}"\n  config.logging.logDir: "${log}"`,
    ).to.be.true;

    expect(path.basename(log)).to.equal("logs");
  });

  it("sessionTimestamp matches expected ISO pattern with no colons or dots", () => {
    expect(sessionTimestamp).to.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/,
    );
  });

  it("sessionDir is built from config.logging.logDir and sessionTimestamp", () => {
    const expected = path.join(
      config.logging.logDir,
      "sessions",
      sessionTimestamp,
    );
    expect(sessionDir).to.equal(expected);
  });

  it("logFiles.session points to session.log in sessionDir", () => {
    expect(logFiles.session).to.equal(path.join(sessionDir, "session.log"));
  });

  ["info", "notice", "error", "warn", "debug"].forEach((level) => {
    it(`logFiles.${level} points to ${level}.log in correct subdir`, () => {
      expect(logFiles[level]).to.equal(
        path.join(config.logging.logDir, level, `${level}.log`),
      );
    });
  });

  it("config.logging.levels defines correct level-to-priority mapping", () => {
    expect(config.logging.levels).to.deep.equal({
      error: 0,
      warn: 1,
      event: 2,
      security: 3,
      notice: 4,
      info: 5,
      debug: 6,
      analytics: 7,
    });
  });
});
