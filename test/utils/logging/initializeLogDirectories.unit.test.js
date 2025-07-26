// test/units/utils/logging/initializeLogDirectories.test.js
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const mockFs = require("mock-fs");
const { initializeLogDirectories } = require("../../../src/utils/logging");

describe("initializeLogDirectories", () => {
  const customLogFiles = {
    info: "../test/logs/info/info.log",
    error: "../test/logs/error/error.log",
    security: "../test/logs/security/security.log",
    warn: "../test/logs/warn/warn.log",
    event: "../test/logs/event/event.log",
    notice: "../test/logs/notice/notice.log",
    debug: "../test/logs/debug/debug.log",
    analytics: "../test/logs/analytics/analytics.log",
  };

  afterEach(() => mockFs.restore());

  it("should create all required directories for given log files", () => {
    mockFs({});
    const result = initializeLogDirectories(customLogFiles);

    for (const file of Object.values(customLogFiles)) {
      const dir = path.dirname(file);
      expect(fs.existsSync(dir)).to.be.true;
    }

    expect(fs.existsSync(result)).to.be.true;
  });

  it("should not fail if directories already exist", () => {
    const dirs = Object.values(customLogFiles).reduce(
      (acc, file) => {
        acc[path.dirname(file)] = {};
        return acc;
      },
      { "../test/logs/functions": {} }
    );

    mockFs(dirs);

    expect(() => initializeLogDirectories(customLogFiles)).to.not.throw();
  });
});
