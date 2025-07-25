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
describe("Edge Cases", () => {
  let consoleLogStub; // Declare stub for this describe block

  beforeEach(() => {
    // Stub console.log specifically for this describe block
    consoleLogStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    // Restore console.log stub after each test in this block
    consoleLogStub.restore();
  });

  it("should handle null and undefined without [object Object]", () => {
    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      null,
      undefined
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("null");
    expect(outputString).to.include("undefined");
  });

  it("should handle objects with null prototype", () => {
    const nullProtoObj = Object.create(null);
    nullProtoObj.key = "value";

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      nullProtoObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("key");
    expect(outputString).to.include("value");
  });

  it("should handle Date objects", () => {
    const dateObj = new Date("2023-01-01T12:00:00.000Z"); // Use ISO string for consistent output

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      dateObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    // Check for parts of the date string that are likely to be present in ISO format
    // Console.log's output for Date objects can vary, but the ISO string is often included or derived.
    expect(outputString).to.include("2023");
    // Check for the time part of the ISO string for more robustness
    expect(outputString).to.include("T12:00:00.000Z");
  });

  it("should handle RegExp objects", () => {
    const regexObj = /test.*pattern/gi;

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      regexObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("test");
    expect(outputString).to.include("pattern");
    expect(outputString).to.include("gi"); // Check for flags
  });

  it("should handle very deeply nested objects", () => {
    let deepObj = { level: 0 };
    let current = deepObj;

    // Create 10 levels deep
    for (let i = 1; i <= 10; i++) {
      current.next = { level: i };
      current = current.next;
    }

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      deepObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("level");
    // Check for presence of multiple levels
    expect(outputString.match(/level/g).length).to.be.at.least(10);
  });
});
