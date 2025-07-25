// test/initializeLogDirectories.test.js
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const mockFs = require("mock-fs");
const { initializeLogDirectories } = require("../../../../src/utils/logging");

describe("initializeLogDirectories", () => {
  const customLogFiles = {
    info: "logs/info/info.log",
    error: "logs/error/error.log",
    warn: "logs/warn/warn.log",
    notice: "logs/notice/notice.log",
    debug: "logs/debug/debug.log",
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
      { "logs/functions": {} }
    );

    mockFs(dirs);

    expect(() => initializeLogDirectories(customLogFiles)).to.not.throw();
  });
});
