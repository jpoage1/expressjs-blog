const { expect } = require("chai");
const sinon = require("sinon");
const fc = require("fast-check");
const proxyquire = require("proxyquire");

// Import the actual sanitizer to use in expectations
const { sanitizeInput } = require("../../../src/utils/sendContactMail");

describe("sendContactMail - Property Based Testing", () => {
  let sendContactMail;
  let transporterStub;
  let fsStub;
  let validateStub;
  let loggerStub;
  let HttpError;

  const MAIL_DOMAIN = "example.com";
  const MAIL_USER = "admin@example.com";
  const DEFAULT_SUBJECT = "Default Subject";
  const LOG_PATH = "/tmp/test-mail-log.json";

  beforeEach(() => {
    transporterStub = {
      sendMail: sinon.stub().resolves({ messageId: "mock-id" }),
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

    const configMock = {
      mail: {
        domain: MAIL_DOMAIN,
        user: MAIL_USER,
        defaultSubject: DEFAULT_SUBJECT,
        logPath: LOG_PATH,
      },
    };

    const mod = proxyquire("../../../src/utils/sendContactMail", {
      "./transporter": transporterStub,
      fs: { promises: fsStub },
      path: require("path"),
      "../utils/emailValidator": { validateAndSanitizeEmail: validateStub },
      "../utils/logging": { winstonLogger: loggerStub },
      "../config": configMock,
      "./HttpError": HttpError,
    });

    sendContactMail = mod.sendContactMail;
  });

  it("should send mail and write log for any valid input (Fuzzing)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 1000 }),
          email: fc.emailAddress(),
          subject: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          message: fc.string({ maxLength: 10000 }),
        }),
        async (input) => {
          await sendContactMail(input);

          expect(transporterStub.sendMail.calledOnce).to.be.true;
          const sendArgs = transporterStub.sendMail.firstCall.args[0];

          // 1. Use the actual sanitize function to predict the output
          const expectedName = sanitizeInput(input.name);
          const expectedMessage = sanitizeInput(input.message);

          // 2. Match the implementation logic: sanitizeInput(subject || default)
          // This handles cases where subject is "" or "  " (which trims to "")
          const expectedSubject = sanitizeInput(
            input.subject || DEFAULT_SUBJECT,
          );

          // 3. Assertions
          expect(sendArgs.to).to.equal(MAIL_USER);
          expect(sendArgs.from).to.contain(MAIL_DOMAIN);
          expect(sendArgs.subject).to.equal(expectedSubject);
          expect(sendArgs.text).to.equal(expectedMessage);

          // Verify name expansion in replyTo
          expect(sendArgs.replyTo).to.equal(
            `"${expectedName}" <${input.email}>`,
          );

          transporterStub.sendMail.resetHistory();
          fsStub.writeFile.resetHistory();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should enforce HttpError on malformed or boundary-violating emails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string(),
          email: fc.string().filter((s) => !/^[^@]+@[^@]+\.[^@]+$/.test(s)),
          subject: fc.string(),
          message: fc.string(),
        }),
        async (input) => {
          try {
            await sendContactMail(input);
            expect.fail("Expected HttpError for malformed email");
          } catch (err) {
            expect(err).to.be.instanceOf(HttpError);
            expect(err.code).to.equal(400);
          }
        },
      ),
    );
  });
});
