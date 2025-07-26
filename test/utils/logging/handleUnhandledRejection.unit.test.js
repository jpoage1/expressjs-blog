const { expect } = require("chai");
const sinon = require("sinon");
const path = require("path");
const proxyquire = require("proxyquire");

describe("handleUnhandledRejection", () => {
  it("logs rejection using winstonLogger", () => {
    const errorStub = sinon.stub();
    const reason = new Error("rejection");

    const handlers = proxyquire(
      path.resolve(__dirname, "../../../src/utils/logging/handlers"),
      {
        "../logging": { winstonLogger: { error: errorStub } },
      }
    );

    handlers.handleUnhandledRejection(reason);
    expect(errorStub.calledWith("Unhandled Rejection:", reason.stack)).to.be
      .true;
  });
});
