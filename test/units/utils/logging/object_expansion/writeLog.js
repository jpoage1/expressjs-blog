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
describe("writeLog function", () => {
  let consoleLogStub; // Declare stub for this describe block

  beforeEach(() => {
    // Stub console.log specifically for this describe block
    consoleLogStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    // Restore console.log stub after each test in this block
    consoleLogStub.restore();
  });

  it("should never log [object Object] for simple objects", () => {
    const testObject = { name: "test", value: 42 };

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      testObject
    );

    // Check console output
    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("name");
    expect(outputString).to.include("test");
    expect(outputString).to.include("value");
    expect(outputString).to.include("42");

    // Check stream output
    expect(streamWriteStubs.info.called).to.be.true;
    const streamOutput = streamWriteStubs.info.getCall(0).args[0];
    expect(streamOutput).to.not.include("[object Object]");
    expect(streamOutput).to.include("name");
    expect(streamOutput).to.include("test");
  });

  it("should properly expand nested objects", () => {
    const nestedObject = {
      user: {
        id: 123,
        profile: {
          name: "John Doe",
          settings: { theme: "dark", notifications: true },
        },
      },
    };

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      nestedObject
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("John Doe");
    expect(outputString).to.include("theme");
    expect(outputString).to.include("dark");
    expect(outputString).to.include("notifications");
  });

  it("should handle circular references without [object Object]", () => {
    const circularObj = { name: "circular" };
    circularObj.self = circularObj;
    circularObj.nested = { parent: circularObj };

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      circularObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("name");
    expect(outputString).to.include("circular");
    // Should handle circular reference gracefully
    expect(outputString).to.include("self");
  });

  it("should expand arrays containing objects", () => {
    const arrayWithObjects = [
      { id: 1, name: "first" },
      { id: 2, name: "second", nested: { value: "test" } },
    ];

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      arrayWithObjects
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("first");
    expect(outputString).to.include("second");
    expect(outputString).to.include("nested");
    expect(outputString).to.include("test");
  });

  it("should handle mixed argument types without [object Object]", () => {
    const mixedArgs = [
      "String message",
      { obj: "value" },
      42,
      ["array", "items"],
      { deeply: { nested: { object: "here" } } },
    ];

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      ...mixedArgs
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("String message");
    expect(outputString).to.include("obj");
    expect(outputString).to.include("value");
    expect(outputString).to.include("deeply");
    expect(outputString).to.include("here");
  });

  it("should handle Error objects without [object Object]", () => {
    const error = new Error("Test error");
    error.customProperty = { details: "additional info" };

    // Stub console.error for this test (local stub, not interfering with console.log stub)
    const consoleErrorStub = sinon.stub(console, "error");

    writeLog(
      "ERROR",
      mockLogStreams.error,
      console.error,
      mockSessionTransport,
      error
    );

    expect(consoleErrorStub.called).to.be.true;
    const consoleArgs = consoleErrorStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("Test error");

    consoleErrorStub.restore();
  });

  it("should handle objects with special properties", () => {
    const specialObj = {
      toString: () => "custom toString",
      valueOf: () => 99,
      [Symbol.toStringTag]: "CustomObject",
      normalProp: "normal value",
    };

    writeLog(
      "INFO",
      mockLogStreams.info,
      console.log,
      mockSessionTransport,
      specialObj
    );

    expect(consoleLogStub.called).to.be.true;
    const consoleArgs = consoleLogStub.getCall(0).args;
    expect(consoleArgs).to.exist;
    const outputString = consoleArgs.join(" ");
    expect(outputString).to.not.include("[object Object]");
    expect(outputString).to.include("normalProp");
    expect(outputString).to.include("normal value");
  });
});
