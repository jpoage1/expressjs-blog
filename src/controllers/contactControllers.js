// src/routes/contact.js
const sendContactMail = require("../utils/sendContactMail");

const verifyHCaptcha = require("../utils/verifyHCaptcha");
const { qualifyLink } = require("../utils/qualifyLinks");
const {
  captureSecurityData,
  analyzeThreatLevel,
  logSecurityEvent,
} = require("../utils/securityForensics");
const { validateAndSanitizeEmail } = require("../utils/emailValidator");

const {
  isValidInput,
  handleInvalidInput,
  buildSecurityData,
  logSubmission,
  handleCaptchaFailure,
  blockHighThreat,
  prepareEmail,
  logSuccess,
  logUnhandledError,
} = require("./heplers/contactHelpers");

module.exports.handleContactFormPost = async (req, res, next) => {
  try {
    const { name, email, message, subject, clientData } = req.body;
    const hcaptchaToken =
      req.body.hcaptchaToken || req.body["g-recaptcha-response"];
    const emailResult = validateAndSanitizeEmail(email);

    if (!isValidInput(name, subject, message, emailResult)) {
      return await handleInvalidInput(
        req,
        next,
        { name, email, subject, message },
        emailResult
      );
    }

    const securityData = buildSecurityData(req, {
      formData: { name, email, message, subject },
      captchaProvided: !!hcaptchaToken,
      clientData,
      step: "initial_validation",
    });

    const threatAnalysis = analyzeThreatLevel(
      { name, email, message, subject },
      securityData
    );

    await logSubmission(securityData, threatAnalysis, {
      name,
      email,
      message,
      subject,
    });

    if (!hcaptchaToken)
      return await handleCaptchaFailure(
        securityData,
        threatAnalysis,
        next,
        "missing_captcha"
      );

    const captchaValid = await verifyHCaptcha(hcaptchaToken);
    if (!captchaValid)
      return await handleCaptchaFailure(
        securityData,
        threatAnalysis,
        next,
        "captcha_failed"
      );

    if (threatAnalysis.level === "high") {
      await blockHighThreat(securityData, threatAnalysis);
      res.customRedirect("/contact/thankyou");
      return;
    }

    const emailData = prepareEmail(
      { name, email, message, subject },
      threatAnalysis
    );
    await sendContactMail(emailData);

    await logSuccess(securityData, threatAnalysis);
    res.customRedirect("/contact/thankyou");
  } catch (err) {
    await logUnhandledError(req, err);
    next(err);
  }
};
module.exports.renderContactForm = async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: "contact_form",
    processingStep: "page_render",
  });

  await logSecurityEvent(securityData, "page_access");

  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Contact",
    formAction: qualifyLink("/contact"),
    formMethod: "POST",
  };
  res.renderWithBaseContext("pages/contact.handlebars", context);
};
module.exports.renderThankYouPage = async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: "thankyou_page",
    processingStep: "page_render",
  });

  await logSecurityEvent(securityData, "thankyou_access");

  res.renderGenericMessage({
    title: "Thank You",
    message:
      "Your message has been sent successfully. We will get back to you shortly.",
  });
};
