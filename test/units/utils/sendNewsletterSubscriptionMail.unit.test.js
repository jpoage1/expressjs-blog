// test/units/utils/sendNewsletterSubscriptionMail.test.js
const sinon = require("sinon");
const transporter = require("../../../src/utils/transporter");
const { winstonLogger } = require("../../../src/utils/logging");
const sendNewsletterSubscriptionMail = require("../../../src/utils/sendNewsletterSubscriptionMail");

describe("sendNewsletterSubscriptionMail", () => {
  let sendMailStub;
  let errorStub;

  beforeEach(() => {
    process.env.MAIL_DOMAIN = "example.com";
    process.env.MAIL_NEWSLETTER = "newsletter@example.com";

    sendMailStub = sinon.stub(transporter, "sendMail");
    errorStub = sinon.stub(winstonLogger, "error");
  });

  afterEach(() => {
    sendMailStub.restore();
    errorStub.restore();
    delete process.env.MAIL_DOMAIN;
    delete process.env.MAIL_NEWSLETTER;
  });

  it("calls transporter.sendMail with correct mail data", async () => {
    sendMailStub.resolves("sent");

    const email = "user@example.com";
    const result = await sendNewsletterSubscriptionMail({ email });

    sinon.assert.calledOnce(sendMailStub);
    sinon.assert.calledWith(sendMailStub, {
      from: "Newsletter <no-reply@example.com>",
      to: email,
      subject: "New Newsletter Subscription",
      text: "Please add this email to the newsletter list: newsletter@example.com",
    });
    sinon.assert.notCalled(errorStub);
  });

  it("logs error when transporter.sendMail rejects", async () => {
    const error = new Error("send failed");
    sendMailStub.rejects(error);

    await sendNewsletterSubscriptionMail({ email: "fail@example.com" });

    sinon.assert.calledOnce(errorStub);
    sinon.assert.calledWith(errorStub, error);
  });
});
