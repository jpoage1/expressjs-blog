const { expect } = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");
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
const { writeLog } = require("../../../../src/utils/logging/consolePatch");
const {
  manualLogger,
  winstonLogger,
} = require("../../../../src/utils/logging/index");

describe("Logger Object Expansion Tests", () => {
  let streamWriteStubs;

  beforeEach(() => {
    // Create fresh stream write stubs for each test
    streamWriteStubs = {
      info: sinon.stub(mockLogStreams.info, "write"),
      error: sinon.stub(mockLogStreams.error, "write"),
      warn: sinon.stub(mockLogStreams.warn, "write"),
      debug: sinon.stub(mockLogStreams.debug, "write"),
      notice: sinon.stub(mockLogStreams.notice, "write"),
    };

    // Reset session transport
    mockSessionTransport.write.reset();
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore(); // This restores all stubs created by sinon.stub()
  });

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

  describe("Manual Logger Methods", () => {
    let manualLoggerStubs;
    // Removed writeLogStub as manualLogger directly interacts with console

    beforeEach(() => {
      // Create fresh stubs for manual logger streams if they exist
      manualLoggerStubs = {};
      if (manualLogger.streams) {
        Object.keys(manualLogger.streams).forEach((level) => {
          if (
            manualLogger.streams[level] &&
            typeof manualLogger.streams[level].write === "function"
          ) {
            if (!manualLogger.streams[level].write.isSinonProxy) {
              manualLoggerStubs[level] = sinon.stub(
                manualLogger.streams[level],
                "write"
              );
            }
          }
        });
      }
    });

    afterEach(() => {
      // Restore all stubs created within this describe block or its tests
      sinon.restore();
    });

    it("should not produce [object Object] in manualLogger.info", () => {
      const testObj = { key: "value", nested: { deep: "property" } };

      // Stub console.log locally for this specific test
      const consoleLogStub = sinon.stub(console, "log");
      manualLogger.info(testObj);

      expect(consoleLogStub.called).to.be.true; // Check if console.log was called
      const consoleArgs = consoleLogStub.getCall(0).args;
      expect(consoleArgs).to.exist;
      const outputString = consoleArgs.join(" "); // Join them to check content
      expect(outputString).to.not.include("[object Object]");
      expect(outputString).to.include("key");
      expect(outputString).to.include("nested");
      expect(outputString).to.include("deep");
      consoleLogStub.restore(); // Restore after test
    });

    it("should not produce [object Object] in manualLogger.error", () => {
      const errorObj = {
        error: "Something went wrong",
        context: { userId: 123, action: "login" },
      };

      // Stub console.error for this test
      const consoleErrorStub = sinon.stub(console, "error");

      manualLogger.error(errorObj);

      expect(consoleErrorStub.called).to.be.true;
      const consoleArgs = consoleErrorStub.getCall(0).args;
      expect(consoleArgs).to.exist;
      const outputString = consoleArgs.join(" ");
      expect(outputString).to.not.include("[object Object]");
      expect(outputString).to.include("Something went wrong");
      expect(outputString).to.include("userId");
      expect(outputString).to.include("login");

      consoleErrorStub.restore();
    });

    xit("should handle circular objects in all manual logger methods", () => {
      const circular = { name: "test" };
      circular.ref = circular;

      const methods = ["info", "warn", "error", "debug", "notice"];
      const consoleMethodMap = {
        info: "log",
        notice: "log",
        warn: "warn",
        error: "error",
        debug: "debug",
      };

      methods.forEach((method) => {
        const sandbox = sinon.createSandbox();
        const consoleMethod = consoleMethodMap[method];

        const methodStub = sandbox
          .stub(console, consoleMethod)
          .callsFake(() => {});

        manualLogger[method](circular);

        expect(methodStub.called).to.be.true; // the offending line

        const consoleArgs = methodStub.getCall(0).args;
        const output = consoleArgs.map(String).join(" ");

        expect(output).to.include("name");
        expect(output).to.include("test");
        expect(output).to.not.include("[object Object]");

        sandbox.restore();
      });
    });
  });

  describe("Winston Logger", () => {
    let winstonInfoStub;

    beforeEach(() => {
      winstonInfoStub = sinon.stub(winstonLogger, "info");
    });

    afterEach(() => {
      winstonInfoStub.restore(); // Ensure winston stub is restored
    });

    it("should not produce [object Object] in winston logs", () => {
      const logData = {
        user: { id: 456, name: "Jane" },
        action: "update",
        metadata: { timestamp: Date.now() },
      };

      winstonLogger.info("User action", logData);

      // Check that winston was called with properly formatted data
      expect(winstonInfoStub.called).to.be.true;
      const logCall = winstonInfoStub.getCall(0).args;
      // Winston typically stringifies objects, so we check the stringified output
      const logString = JSON.stringify(logCall);
      expect(logString).to.not.include("[object Object]");
      expect(logString).to.include("Jane");
      expect(logString).to.include("update");
    });
  });

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
});

const consolePatch = require("../../../../src/utils/logging/consolePatch");

describe("Logger Object Expansion Tests", () => {
  let shouldLogStub;

  before(() => {
    shouldLogStub = sinon.stub(consolePatch, "shouldLog").returns(true);
  });

  after(() => {
    shouldLogStub.restore();
  });

  it("should handle circular objects in all manual logger methods", () => {
    const circular = { name: "test" };
    circular.ref = circular;

    const methods = ["info", "warn", "error", "debug", "notice"];
    const consoleMethodMap = {
      info: "log",
      notice: "log",
      warn: "warn",
      error: "error",
      debug: "debug",
    };

    methods.forEach((method) => {
      const sandbox = sinon.createSandbox();
      const consoleMethod = consoleMethodMap[method];

      const methodStub = sandbox.stub(console, consoleMethod);

      manualLogger[method](circular);

      expect(methodStub.called).to.be.true;

      const output = methodStub.getCall(0).args.map(String).join(" ");
      expect(output).to.include("name");
      expect(output).to.include("test");
      expect(output).to.not.include("[object Object]");

      sandbox.restore();
    });
  });
});
