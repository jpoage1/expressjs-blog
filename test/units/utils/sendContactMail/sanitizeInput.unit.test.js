const { expect } = require("chai");

const { sanitizeInput } = require("../../../../src/utils/sendContactMail");

describe("sanitizeInput", () => {
  it("removes carriage returns", () => {
    const result = sanitizeInput("hello\rworld");
    expect(result).to.equal("helloworld");
  });

  it("removes newlines", () => {
    const result = sanitizeInput("hello\nworld");
    expect(result).to.equal("helloworld");
  });

  it("removes angle brackets", () => {
    const result = sanitizeInput("<script>alert(1)</script>");
    expect(result).to.equal("scriptalert(1)/script");
  });

  it("trims leading and trailing spaces", () => {
    const result = sanitizeInput("   test input   ");
    expect(result).to.equal("test input");
  });

  it("coerces non-strings to strings", () => {
    const result = sanitizeInput(12345);
    expect(result).to.equal("12345");
  });

  it("returns empty string for null", () => {
    const result = sanitizeInput(null);
    expect(result).to.equal("null");
  });

  it("returns empty string for undefined", () => {
    const result = sanitizeInput(undefined);
    expect(result).to.equal("undefined");
  });
});
