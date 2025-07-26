// test/units/utils/logging/formatFunctionName.test.js
const { expect } = require("chai");
const path = require("path");
const { formatFunctionName } = require("../../../../src/utils/logging");

describe("formatFunctionName", () => {
  it("returns relative path with forward slashes", () => {
    const base = path.join(__dirname, "..", "..", "..", "..");
    const testPath = path.join(base, "src", "somefile.js");
    const result = formatFunctionName(testPath, base);

    expect(result).to.equal("src/somefile.js");
  });
});
