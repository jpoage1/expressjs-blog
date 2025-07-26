const { formatLog } = require("../../../../src/utils/logging/consolePatch");
const { expect } = require("chai");

describe("Logger Format Function Tests", () => {
  it("should format circular objects without throwing and stringify correctly", () => {
    const circular = { name: "test" };
    circular.ref = circular;

    const methods = ["INFO", "WARN", "ERROR", "DEBUG", "NOTICE"];

    methods.forEach((level) => {
      const { timestamp, safeArgs, message, logLine } = formatLog(
        level,
        circular
      );

      expect(timestamp).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      expect(safeArgs).to.be.an("array");
      expect(message).to.include("name");
      expect(message).to.include("test");
      expect(message).to.not.include("[object Object]");
      expect(logLine).to.include(`[${timestamp}] [${level}]`);
      expect(logLine).to.include(message);
    });
  });
});
