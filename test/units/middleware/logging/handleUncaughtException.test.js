// test/handleUncaughtException.test.js
const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru(); // prevents loading actual file if stubbed

describe("handleUncaughtException", () => {
  it("logs error using winstonLogger", () => {
    const errorStub = sinon.stub();

    const fakeLogger = {
      winstonLogger: {
        error: errorStub,
      },
    };

    const { handleUncaughtException } = proxyquire(
      "../../../../src/utils/logging/handlers",
      {
        "./index": fakeLogger,
      }
    );

    const err = new Error("fail");
    handleUncaughtException(err);

    expect(errorStub.calledWith("Uncaught Exception:", err.stack)).to.be.true;
  });
});
