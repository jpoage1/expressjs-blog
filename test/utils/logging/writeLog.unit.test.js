// test/units/utils/logging/writeLog.test.js
const { expect } = require("chai");
const sinon = require("sinon");
const { writeLog } = require("../../../src/utils/logging/consolePatch");

describe("writeLog - Object Expansion Tests", () => {
  let stream;
  let consoleFn;
  let sessionTransport;
  let clock;
  const fixedDate = new Date("2025-07-25T12:00:00.000Z");

  beforeEach(() => {
    stream = { write: sinon.spy() };
    consoleFn = sinon.spy();
    sessionTransport = { write: sinon.spy() };
    clock = sinon.useFakeTimers(fixedDate.getTime());
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe("prevents [object Object] output", () => {
    it("expands simple objects instead of showing [object Object]", () => {
      const testObject = { name: "test", value: 42 };

      writeLog("INFO", stream, sessionTransport, consoleFn, testObject);

      const expectedTimestamp = fixedDate.toISOString();

      // Check stream output doesn't contain [object Object]
      expect(stream.write.called).to.be.true;
      const streamCall = stream.write.getCall(0);
      const streamOutput = streamCall.args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("name");
      expect(streamOutput).to.include("test");
      expect(streamOutput).to.include("value");
      expect(streamOutput).to.include("42");

      // Check console output doesn't contain [object Object]
      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleArgs = consoleCall.args;
      expect(consoleArgs).to.exist;
      expect(Array.isArray(consoleArgs)).to.be.true;
      const consoleOutput = consoleArgs.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleArgs).to.include.members([`[${expectedTimestamp}] [INFO]`]);

      // Check sessionTransport message doesn't contain [object Object]
      expect(sessionTransport.write.called).to.be.true;
      const sessionCall = sessionTransport.write.getCall(0);
      const sessionData = sessionCall.args[0];
      expect(sessionData.message).to.not.include("[object Object]");
      expect(sessionData.message).to.include("name");
      expect(sessionData.message).to.include("test");
    });

    it("expands nested objects completely", () => {
      const nestedObject = {
        user: {
          id: 123,
          profile: {
            name: "John Doe",
            settings: { theme: "dark", notifications: true },
          },
        },
      };

      writeLog("INFO", stream, sessionTransport, consoleFn, nestedObject);

      // Check all outputs expand the nested structure
      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("John Doe");
      expect(streamOutput).to.include("theme");
      expect(streamOutput).to.include("dark");
      expect(streamOutput).to.include("notifications");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleOutput).to.include("John Doe");
      expect(consoleOutput).to.include("theme");

      expect(sessionTransport.write.called).to.be.true;
      const sessionMessage = sessionTransport.write.getCall(0).args[0].message;
      expect(sessionMessage).to.not.include("[object Object]");
      expect(sessionMessage).to.include("John Doe");
    });

    it("expands arrays containing objects", () => {
      const arrayWithObjects = [
        { id: 1, name: "first" },
        { id: 2, name: "second", nested: { value: "test" } },
      ];

      writeLog("INFO", stream, sessionTransport, consoleFn, arrayWithObjects);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("first");
      expect(streamOutput).to.include("second");
      expect(streamOutput).to.include("nested");
      expect(streamOutput).to.include("test");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleOutput).to.include("first");
      expect(consoleOutput).to.include("second");
    });

    it("handles mixed argument types without [object Object]", () => {
      const mixedArgs = [
        "String message",
        { obj: "value" },
        42,
        ["array", "items"],
        { deeply: { nested: { object: "here" } } },
      ];

      writeLog("INFO", stream, sessionTransport, consoleFn, ...mixedArgs);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("String message");
      expect(streamOutput).to.include("obj");
      expect(streamOutput).to.include("value");
      expect(streamOutput).to.include("deeply");
      expect(streamOutput).to.include("here");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleOutput).to.include("String message");
      expect(consoleOutput).to.include("obj");
    });

    it("expands Error objects properly", () => {
      const error = new Error("Test error");
      error.customProperty = { details: "additional info" };

      writeLog("ERROR", stream, sessionTransport, consoleFn, error);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("Test error");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleOutput).to.include("Test error");
    });

    it("handles objects with special properties", () => {
      const specialObj = {
        toString: () => "custom toString",
        valueOf: () => 99,
        normalProp: "normal value",
        anotherProp: { nested: "data" },
      };

      writeLog("INFO", stream, sessionTransport, consoleFn, specialObj);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("normalProp");
      expect(streamOutput).to.include("normal value");
      expect(streamOutput).to.include("nested");
      expect(streamOutput).to.include("data");

      expect(sessionTransport.write.called).to.be.true;
      const sessionMessage = sessionTransport.write.getCall(0).args[0].message;
      expect(sessionMessage).to.not.include("[object Object]");
      expect(sessionMessage).to.include("normalProp");
    });
  });

  describe("edge cases", () => {
    it("handles null and undefined without [object Object]", () => {
      writeLog("INFO", stream, sessionTransport, consoleFn, null, undefined);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("null");
      expect(streamOutput).to.include("undefined");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
    });

    it("handles Date objects", () => {
      const dateObj = new Date("2023-01-01");

      writeLog("INFO", stream, sessionTransport, consoleFn, dateObj);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("2023");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
    });

    it("handles RegExp objects", () => {
      const regexObj = /test.*pattern/gi;

      writeLog("INFO", stream, sessionTransport, consoleFn, regexObj);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("test");
      expect(streamOutput).to.include("pattern");
    });

    it("handles objects with null prototype", () => {
      const nullProtoObj = Object.create(null);
      nullProtoObj.key = "value";
      nullProtoObj.nested = { prop: "data" };

      writeLog("INFO", stream, sessionTransport, consoleFn, nullProtoObj);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("key");
      expect(streamOutput).to.include("value");
      expect(streamOutput).to.include("prop");
      expect(streamOutput).to.include("data");
    });

    it("handles very deeply nested objects", () => {
      let deepObj = { level: 0 };
      let current = deepObj;

      // Create 5 levels deep (reasonable for testing)
      for (let i = 1; i <= 5; i++) {
        current.next = { level: i, data: `level${i}data` };
        current = current.next;
      }

      writeLog("INFO", stream, sessionTransport, consoleFn, deepObj);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("level");
      expect(streamOutput).to.include("level5data");
    });
  });

  describe("different log levels", () => {
    const levels = ["INFO", "WARN", "ERROR", "DEBUG", "NOTICE"];

    levels.forEach((level) => {
      it(`expands objects properly for ${level} level`, () => {
        const testObj = {
          level: level.toLowerCase(),
          data: { nested: "value" },
          array: [{ item: "test" }],
        };

        writeLog(level, stream, sessionTransport, consoleFn, testObj);

        // Only check if the function was called for levels that should log
        if (stream.write.called) {
          const streamOutput = stream.write.getCall(0).args[0];
          expect(streamOutput).to.not.include("[object Object]");
          expect(streamOutput).to.include("nested");
          expect(streamOutput).to.include("value");
          expect(streamOutput).to.include("item");
          expect(streamOutput).to.include("test");
        }

        if (sessionTransport.write.called) {
          const sessionMessage =
            sessionTransport.write.getCall(0).args[0].message;
          expect(sessionMessage).to.not.include("[object Object]");
          expect(sessionMessage).to.include("nested");
        }
      });
    });
  });

  describe("multiple objects in single call", () => {
    it("expands all objects in arguments", () => {
      const obj1 = { first: "object", nested: { value: 1 } };
      const obj2 = { second: "object", array: [{ item: "test" }] };
      const obj3 = { third: { deeply: { nested: "value" } } };

      writeLog("INFO", stream, sessionTransport, consoleFn, obj1, obj2, obj3);

      expect(stream.write.called).to.be.true;
      const streamOutput = stream.write.getCall(0).args[0];
      expect(streamOutput).to.not.include("[object Object]");
      expect(streamOutput).to.include("first");
      expect(streamOutput).to.include("second");
      expect(streamOutput).to.include("third");
      expect(streamOutput).to.include("deeply");
      expect(streamOutput).to.include("nested");
      expect(streamOutput).to.include("item");
      expect(streamOutput).to.include("test");

      expect(consoleFn.called).to.be.true;
      const consoleCall = consoleFn.getCall(0);
      expect(consoleCall).to.exist;
      const consoleOutput = consoleCall.args.join(" ");
      expect(consoleOutput).to.not.include("[object Object]");
      expect(consoleOutput).to.include("first");
      expect(consoleOutput).to.include("second");
      expect(consoleOutput).to.include("third");
    });
  });
});
