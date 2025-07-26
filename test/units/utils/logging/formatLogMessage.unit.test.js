// test/units/utils/logging/formatLogMessage.test.js
const { expect } = require("chai");
const { formatLogMessage } = require("../../../../src/utils/logging");

describe("formatLogMessage", () => {
  it("formats message with timestamp and args", () => {
    const fn = "testFunc.js";
    const args = ["arg1", "arg2"];
    const result = formatLogMessage(fn, args);

    expect(result).to.match(/\[\d{4}-\d{2}-\d{2}T/); // ISO date start
    expect(result).to.include("arg1 arg2");
    expect(result).to.match(/\n$/);
  });
});
