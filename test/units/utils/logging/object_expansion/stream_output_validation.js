const { expect } = require("chai");
const sinon = require("sinon");
const { Writable } = require("stream");

// Mock dependencies
const mockLogStreams = {
  info: new Writable({ write() {} }),
  error: new Writable({ write() {} }),
  warn: new Writable({ write() {} }),
  debug: new Writable({ write() {} }),
  notice: new Writable({ write() {} }),
};

const mockSessionTransport = {
  write: sinon.stub(),
};

// Import the modules under test
const { writeLog } = require("../../../../../src/utils/logging/consolePatch");

describe("Stream Output Validation", () => {
  let consoleLogStub; // Declare stub for this describe block

  beforeEach(() => {
    // Stub console.log specifically for this describe block
    consoleLogStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    // Restore console.log stub after each test in this block
    consoleLogStub.restore();
  });

  it("should ensure stream writes never contain [object Object]", () => {
    const testObjects = [
      { simple: "object" },
      { nested: { deep: { value: "test" } } },
      [{ array: "item" }],
      { mixed: ["array", { in: "object" }] },
    ];

    testObjects.forEach((obj, index) => {
      streamWriteStubs.info.resetHistory(); // Reset history for each iteration
      writeLog(
        "INFO",
        mockLogStreams.info,
        console.log,
        mockSessionTransport,
        obj
      );

      expect(streamWriteStubs.info.called).to.be.true;
      const streamWrites = streamWriteStubs.info.getCalls();
      streamWrites.forEach((call) => {
        const writeData = call.args[0];
        // Ensure the written data is a string and does not contain "[object Object]"
        expect(typeof writeData).to.equal("string");
        expect(writeData).to.not.include("[object Object]");
      });
    });
  });
});
