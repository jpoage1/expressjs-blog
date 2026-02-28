require("dotenv").config();
const { expect } = require("chai");
const {
  meta,
  public: server,
  network,
  hcaptcha,
  mail,
} = require("../src/config/loader");

describe("Environment Variables Validation", () => {
  it("should have SITE_OWNER defined as a non-empty string", () => {
    expect(meta.site_owner).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_DOMAIN defined as a non-empty string", () => {
    expect(server.domain).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_ADDRESS defined as a non-empty string", () => {
    expect(server.address).to.be.a("string").and.not.empty;
  });

  it("should have SERVER_SCHEMA defined and be either 'http' or 'https'", () => {
    expect(server.schema).to.be.oneOf(["http", "https"]);
  });

  it("should have NODE_ENV defined and be either 'development', 'testing' or 'production'", () => {
    expect(meta.node_env).to.be.oneOf(["development", "testing", "production"]);
  });

  it("should have SERVER_PORT defined and be a valid port number", () => {
    const port = Number(server.port);
    expect(port)
      .to.be.a("number")
      .and.satisfy((num) => num > 0 && num < 65536);
  });

  it("should have MAIL_SECURE defined as a boolean string ('true' or 'false')", () => {
    expect(mail.secure).to.be.oneOf(["true", "false"]);
  });

  it("should have MAIL_HOST defined as a non-empty string", () => {
    expect(mail.host).to.be.a("string").and.not.empty;
  });

  it("should have MAIL_PORT defined and be a valid port number", () => {
    const mailPort = Number(mail.port);
    expect(mailPort)
      .to.be.a("number")
      .and.satisfy((num) => num > 0 && num < 65536);
  });

  it("should have HCAPTCHA_SECRET defined and not be empty", () => {
    expect(hcaptcha.secret).to.be.a("string").and.not.empty;
  });
});
