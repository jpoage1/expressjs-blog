// test/writeLog.test.js
const { expect } = require("chai");
const sinon = require("sinon");
const { writeLog } = require("../../../../src/utils/logging/consolePatch");

describe("writeLog", () => {
  let stream;
  let consoleFn;
  let sessionTransport;
  let clock;
  const fixedDate = new Date("2025-07-25T12:00:00.000Z");

  beforeEach(() => {
    stream = { write: sinon.spy() };
    consoleFn = sinon.spy();

    global.sessionTransport = { write: sinon.spy() };
    sessionTransport = global.sessionTransport;

    clock = sinon.useFakeTimers(fixedDate.getTime());
  });

  afterEach(() => {
    clock.restore();
    delete global.sessionTransport;
  });

  it("does not write when shouldLog returns false", () => {
    const originalLogLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "error";

    writeLog("DEBUG", stream, consoleFn, "test message");

    expect(stream.write.called).to.be.false;
    expect(consoleFn.called).to.be.false;
    expect(sessionTransport.write.called).to.be.false;

    process.env.LOG_LEVEL = originalLogLevel;
  });

  it("writes log line to stream and calls consoleFn and sessionTransport.write", () => {
    writeLog("INFO", stream, consoleFn, "test", "message");

    const expectedTimestamp = fixedDate.toISOString();
    const expectedLogLine = `[${expectedTimestamp}] [INFO] test message\n`;

    expect(stream.write.calledWith(expectedLogLine)).to.be.true;
    expect(
      sessionTransport.write.calledWith({
        level: "info",
        message: "test message",
        timestamp: expectedTimestamp,
      })
    ).to.be.true;
    expect(
      consoleFn.calledWith(`[${expectedTimestamp}] [INFO]`, "test", "message")
    ).to.be.true;
  });

  it("joins multiple args correctly in message", () => {
    writeLog("WARN", stream, consoleFn, "part1", "part2", "part3");

    const expectedTimestamp = fixedDate.toISOString();
    const expectedLogLine = `[${expectedTimestamp}] [WARN] part1 part2 part3\n`;

    expect(stream.write.calledWith(expectedLogLine)).to.be.true;
    expect(
      sessionTransport.write.calledWith({
        level: "warn",
        message: "part1 part2 part3",
        timestamp: expectedTimestamp,
      })
    ).to.be.true;
    expect(
      consoleFn.calledWith(
        `[${expectedTimestamp}] [WARN]`,
        "part1",
        "part2",
        "part3"
      )
    ).to.be.true;
  });
});
