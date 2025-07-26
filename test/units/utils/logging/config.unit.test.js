// test/units/utils/logging/config.test.js
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const proxyquire = require("proxyquire").noPreserveCache();

const {
  projectRoot,
  logDir,
  sessionTimestamp,
  sessionDir,
  logFiles,
  LOG_LEVELS,
} = require("../../../../src/utils/logging/config");

describe("config.js", () => {
  it("projectRoot contains package.json", () => {
    const pkgJsonPath = path.join(projectRoot, "package.json");
    const exists = fs.existsSync(pkgJsonPath);
    expect(exists).to.equal(true, `package.json not found in ${projectRoot}`);
  });

  it("projectRoot matches resolved 3-levels-up path", () => {
    const expected = path.resolve(__dirname, "../../../../");
    expect(projectRoot).to.equal(expected);
  });

  it("logDir is within projectRoot and ends with 'logs'", () => {
    expect(logDir.startsWith(projectRoot)).to.be.true;
    expect(path.basename(logDir)).to.equal("logs");
  });

  it("sessionTimestamp matches expected ISO pattern with no colons or dots", () => {
    expect(sessionTimestamp).to.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/
    );
  });

  it("sessionDir is built from logDir and sessionTimestamp", () => {
    const expected = path.join(logDir, "sessions", sessionTimestamp);
    expect(sessionDir).to.equal(expected);
  });

  it("logFiles.session points to session.log in sessionDir", () => {
    expect(logFiles.session).to.equal(path.join(sessionDir, "session.log"));
  });

  ["info", "notice", "error", "warn", "debug"].forEach((level) => {
    it(`logFiles.${level} points to ${level}.log in correct subdir`, () => {
      expect(logFiles[level]).to.equal(
        path.join(logDir, level, `${level}.log`)
      );
    });
  });

  it("LOG_LEVELS defines correct level-to-priority mapping", () => {
    expect(LOG_LEVELS).to.deep.equal({
      error: 0,
      warn: 1,
      security: 2,
      notice: 3,
      info: 4,
      debug: 5,
    });
  });

  it("LOG_LEVEL defaults to 'info' when process.env.LOG_LEVEL is unset", () => {
    const original = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;

    const { LOG_LEVEL } = proxyquire(
      "../../../../src/utils/logging/config",
      {}
    );
    expect(LOG_LEVEL).to.equal("info");

    if (original !== undefined) process.env.LOG_LEVEL = original;
  });
});
