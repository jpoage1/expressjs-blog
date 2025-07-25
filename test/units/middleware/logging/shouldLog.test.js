// test/shouldLog.test.js
const { expect } = require("chai");
const path = require("path");

describe("shouldLog", () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    process.env.LOG_LEVEL = "warn";
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalLogLevel;
    delete require.cache[
      require.resolve("../../../../src/utils/logging/consolePatch")
    ];
  });

  it("returns true if level is higher or equal to current log level", () => {
    const { shouldLog } = require("../../../../src/utils/logging/consolePatch");

    expect(shouldLog("error")).to.be.true;
    expect(shouldLog("warn")).to.be.true;
    expect(shouldLog("debug")).to.be.false;
  });
});
