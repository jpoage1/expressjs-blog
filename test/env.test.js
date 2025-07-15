require("dotenv").config();
const { expect } = require("chai");

describe("Environment Variables Validation", () => {
  it("should have SITE_OWNER defined as a non-empty string", () => {
    expect(process.env.SITE_OWNER).to.be.a("string").and.not.empty;
  });

  it("should have DOMAIN defined as a non-empty string", () => {
    expect(process.env.DOMAIN).to.be.a("string").and.not.empty;
  });

  it("should have NODE_ENV defined and be either 'development' or 'production'", () => {
    expect(process.env.NODE_ENV).to.be.oneOf(["development", "production"]);
  });

  it("should have PORT defined and be a valid port number", () => {
    const port = Number(process.env.PORT);
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
