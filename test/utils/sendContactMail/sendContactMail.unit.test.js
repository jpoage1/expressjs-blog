const chai = require("chai");
const sinon = require("sinon");
const fs = require("fs").promises;
const path = require("path");

const chaiAsPromised =
  require("chai-as-promised").default || require("chai-as-promised");

const HttpError = require("../../../src/utils/HttpError");

chai.use(chaiAsPromised);
const { expect } = chai;

describe("sendContactMail", () => {
  let validateAndSanitizeEmailStub;
  let transporterStub;
  let loggerStub;
  let sendContactMail;
  let fsReadStub;
  let fsWriteStub;

  const validInput = {
    name: "Jane Doe",
    email: "jane@example.com",
    subject: "Hello",
    message: "This is a test.",
  };

  const mockEmailResponse = {
    accepted: ["admin@example.com"],
    rejected: [],
    response: "250 Message accepted",
    envelope: {
      from: "no-reply@example.com",
      to: ["admin@example.com"],
    },
    messageId: "<test-id@example.com>",
  };

  const mockEmailConfig = {
    MAIL_DOMAIN: "example.com",
    MAIL_USER: "admin@example.com",
    DEFAULT_SUBJECT: "New Contact Form Submission",
    EMAIL_LOG_PATH: path.join(__dirname, "../../../data/emails.json"),
  };

  beforeEach(() => {
    // Clear module cache
    delete require.cache[require.resolve("../../../src/utils/sendContactMail")];
    delete require.cache[require.resolve("../../../src/utils/emailValidator")];
    delete require.cache[require.resolve("../../../src/utils/transporter")];
    delete require.cache[require.resolve("../../../src/utils/logging")];
    delete require.cache[require.resolve("../../../src/config/emailConfig")];

    // Create stubs
    validateAndSanitizeEmailStub = sinon.stub().returns({
      valid: true,
      email: "jane@example.com",
    });

    transporterStub = {
      sendMail: sinon.stub().resolves(mockEmailResponse),
    };

    loggerStub = {
      error: sinon.stub(),
    };

    require.cache[require.resolve("../../../src/config/emailConfig")] = {
      exports: mockEmailConfig,
    };

    // Mock modules in require cache
    require.cache[require.resolve("../../../src/utils/emailValidator")] = {
      exports: { validateAndSanitizeEmail: validateAndSanitizeEmailStub },
    };

    require.cache[require.resolve("../../../src/utils/transporter")] = {
      exports: transporterStub,
    };

    require.cache[require.resolve("../../../src/utils/logging")] = {
      exports: { winstonLogger: loggerStub },
    };

    // Set environment variables
    process.env.MAIL_DOMAIN = "example.com";
    process.env.MAIL_USER = "admin@example.com";

    // Create fs stubs
    fsReadStub = sinon.stub(fs, "readFile");
    fsWriteStub = sinon.stub(fs, "writeFile");

    // Require the module after mocking
    const module = require("../../../src/utils/sendContactMail");
    sendContactMail = module.sendContactMail;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("sends an email with valid input", async () => {
    fsReadStub.resolves("[]");
    fsWriteStub.resolves();

    const result = await sendContactMail(validInput);

    // Check the result matches what transporter.sendMail returns
    expect(result).to.deep.equal(mockEmailResponse);

    // Verify transporter.sendMail was called once
    expect(transporterStub.sendMail.calledOnce).to.be.true;

    // Check the email parameters
    const sendArgs = transporterStub.sendMail.getCall(0).args[0];
    expect(sendArgs.from).to.equal('"Contact Form" <no-reply@example.com>');
    expect(sendArgs.to).to.equal("admin@example.com");
    expect(sendArgs.replyTo).to.equal('"Jane Doe" <jane@example.com>');
    expect(sendArgs.subject).to.equal("Hello");
    expect(sendArgs.text).to.equal("This is a test.");

    // Verify file operations
    expect(fsReadStub.calledOnce).to.be.true;
    expect(fsWriteStub.calledOnce).to.be.true;
  });

  it("uses default subject if none provided", async () => {
    const input = { ...validInput, subject: undefined };
    fsReadStub.resolves("[]");
    fsWriteStub.resolves();

    const result = await sendContactMail(input);

    // Check that we get the mock response, not an empty object
    expect(result).to.deep.equal(mockEmailResponse);

    const args = transporterStub.sendMail.firstCall.args[0];
    expect(args.subject).to.equal("New Contact Form Submission");
  });

  it("throws HttpError on invalid email", async () => {
    validateAndSanitizeEmailStub.returns({
      valid: false,
      message: "Invalid email format",
    });

    await expect(sendContactMail(validInput)).to.be.rejectedWith(HttpError);
  });

  it("logs and rethrows on readFile error", async () => {
    const error = new Error("Disk failure");
    fsReadStub.rejects(error);

    await expect(sendContactMail(validInput)).to.be.rejectedWith(
      "Disk failure"
    );

    // Verify logger was called
    expect(loggerStub.error.calledOnce).to.be.true;
    expect(loggerStub.error.calledWith("Failed to log email to file:", error))
      .to.be.true;
  });

  it("throws on invalid email without message", async () => {
    validateAndSanitizeEmailStub.returns({
      valid: false,
      message: undefined,
    });

    await expect(sendContactMail(validInput)).to.be.rejectedWith(HttpError);
  });

  it("handles non-empty existing log file", async () => {
    const existingLogs = JSON.stringify([{ test: true }]);
    fsReadStub.resolves(existingLogs);
    fsWriteStub.resolves();

    const result = await sendContactMail(validInput);
    expect(result).to.deep.equal(mockEmailResponse);

    // Verify the log was written with existing data plus new entry
    expect(fsWriteStub.calledOnce).to.be.true;
    const writtenData = JSON.parse(fsWriteStub.firstCall.args[1]);
    expect(writtenData).to.be.an("array").with.lengthOf(2);
    expect(writtenData[0]).to.deep.equal({ test: true });
  });

  it("throws if writing log file fails", async () => {
    fsReadStub.resolves("[]");
    const error = new Error("Write failed");
    fsWriteStub.rejects(error);

    await expect(sendContactMail(validInput)).to.be.rejectedWith(
      "Write failed"
    );

    // Verify logger was called
    expect(loggerStub.error.calledOnce).to.be.true;
    expect(loggerStub.error.calledWith("Failed to log email to file:", error))
      .to.be.true;
  });
});
