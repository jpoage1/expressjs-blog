require("dotenv").config();
const { expect } = require("chai");

describe("Environment Variables Validation", () => {
  it("should have SITE_OWNER defined as a non-empty string", () => {
    expect(process.env.SITE_OWNER).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_DOMAIN defined as a non-empty string", () => {
    expect(process.env.SERVER_DOMAIN).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_ADDRESS defined as a non-empty string", () => {
    expect(process.env.SERVER_ADDRESS).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_SCHEMA defined and be either 'http' or 'https'", () => {
    expect(process.env.SERVER_SCHEMA).to.be.oneOf(["http", "https"]);
  });

  it("should have NODE_ENV defined and be either 'development', 'testing' or 'production'", () => {
    expect(process.env.NODE_ENV).to.be.oneOf([
      "development",
      "testing",
      "production",
    ]);
  });

  it("should have SERVER_PORT defined and be a valid port number", () => {
    const port = Number(process.env.SERVER_PORT);
    expect(port)
      .to.be.a("number")
      .and.satisfy((num) => num > 0 && num < 65536);
  });

  it("should have MAIL_SECURE defined as a boolean string ('true' or 'false')", () => {
    expect(process.env.MAIL_SECURE).to.be.oneOf(["true", "false"]);
  });

  it("should have MAIL_HOST defined as a non-empty string", () => {
    expect(process.env.MAIL_HOST).to.be.a("string").and.not.empty;
  });

  it("should have MAIL_PORT defined and be a valid port number", () => {
    const mailPort = Number(process.env.MAIL_PORT);
    expect(mailPort)
      .to.be.a("number")
      .and.satisfy((num) => num > 0 && num < 65536);
  });

  it("should have HCAPTCHA_SECRET defined and not be empty", () => {
    expect(process.env.HCAPTCHA_SECRET).to.be.a("string").and.not.empty;
  });
});
