// test/units/utils/logging/createLogStreams.test.js
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { createLogStreams } = require("../../../src/utils/logging/streams");

describe("createLogStreams", () => {
  const testDir = path.join(__dirname, "..", "..", "logs");
  const files = {
    analytics: path.join(testDir, "analytics.log"),
    error: path.join(testDir, "error.log"),
    security: path.join(testDir, "security.log"),
    warn: path.join(testDir, "warn.log"),
    notice: path.join(testDir, "notice.log"),
    event: path.join(testDir, "event.log"),
    info: path.join(testDir, "info.log"),
    debug: path.join(testDir, "debug.log"),
  };

  afterEach(() => {
    Object.values(files).forEach((file) => {
      try {
        fs.unlinkSync(file);
      } catch (_) {}
    });
  });

  it("should create write streams for all log files", () => {
    const streams = createLogStreams(files);
    for (const key of Object.keys(files)) {
      expect(streams[key]).to.be.an.instanceof(fs.WriteStream);
    }
  });
});
