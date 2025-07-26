const { expect } = require("chai");
const sinon = require("sinon");
const fc = require("fast-check");
const proxyquire = require("proxyquire");

describe("sendContactMail", () => {
  let sendContactMail;
  let transporterStub;
  let fsStub;
  let validateStub;
  let loggerStub;
  let HttpError;

  const MAIL_DOMAIN = "example.com";
  const MAIL_USER = "admin@example.com";
  const DEFAULT_SUBJECT = "Default Subject";
  const EMAIL_LOG_PATH = "/tmp/test-mail-log.json";

  beforeEach(() => {
    transporterStub = {
      sendMail: sinon.stub().resolves("OK"),
    };

    fsStub = {
      readFile: sinon.stub().resolves("[]"),
      writeFile: sinon.stub().resolves(),
    };

    validateStub = sinon.stub().callsFake((email) => ({
      valid: /^[^@]+@[^@]+\.[^@]+$/.test(email),
      email,
      message: "Invalid email",
    }));

    loggerStub = { error: sinon.stub() };

    HttpError = class extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
      }
    };

    const mod = proxyquire("../../../src/utils/sendContactMail", {
      "./transporter": transporterStub,
      fs: { promises: fsStub },
      path: require("path"),
      "../utils/emailValidator": { validateAndSanitizeEmail: validateStub },
      "../utils/logging": { winstonLogger: loggerStub },
      "../config/emailConfig": {
        MAIL_DOMAIN,
        MAIL_USER,
        DEFAULT_SUBJECT,
        EMAIL_LOG_PATH,
      },
      "./HttpError": HttpError,
    });

    sendContactMail = mod.sendContactMail;
  });

  it("should send mail and write log for any valid email", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string(),
          email: fc.emailAddress(),
          subject: fc.option(fc.string(), { nil: undefined }),
          message: fc.string(),
        }),
        async (input) => {
          await sendContactMail(input);

          expect(transporterStub.sendMail.calledOnce).to.be.true;
          expect(fsStub.writeFile.calledOnce).to.be.true;

          const args = transporterStub.sendMail.firstCall.args[0];
          expect(args).to.include.keys(
            "from",
            "to",
            "replyTo",
            "subject",
            "text"
          );

          transporterStub.sendMail.resetHistory();
          fsStub.writeFile.resetHistory();
        }
      )
    );
  });

  it("should throw HttpError on invalid email", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string(),
          email: fc.string().filter((s) => !/^[^@]+@[^@]+\.[^@]+$/.test(s)), // force invalid
          subject: fc.string(),
          message: fc.string(),
        }),
        async (input) => {
          try {
            await sendContactMail(input);
            expect.fail("Expected HttpError");
          } catch (err) {
            expect(err).to.be.instanceOf(HttpError);
            expect(err.message).to.equal("Invalid email");
            expect(err.code).to.equal(400);
          }
        }
      )
    );
  });
});
