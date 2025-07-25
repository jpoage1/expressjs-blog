const { expect } = require("chai");
const sinon = require("sinon");

const { winstonLogger } = require("../../../../../src/utils/logging/index");

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
