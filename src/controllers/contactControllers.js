// src/routes/contact.js
const { sendContactMail } = require("../utils/sendContactMail");
const verifyHCaptcha = require("../utils/verifyHCaptcha");
const { qualifyLink } = require("../utils/qualifyLinks");
const { analyzeThreatLevel } = require("../utils/securityForensics");
const { validateAndSanitizeEmail } = require("../utils/emailValidator");

const {
  isValidInput,
  buildSecurityData,
  prepareEmail,
} = require("./helpers/contactHelpers");
const SecurityEvent = require("#src/utils/SecurityEvent.js");

module.exports.handleContactFormPost = async (req, res, next) => {
  try {
    const { name, email, message, subject, clientData } = req.body;
    const hcaptchaToken =
      req.body.hcaptchaToken || req.body["g-recaptcha-response"];
    const emailResult = validateAndSanitizeEmail(email);

    // Validate input and handle failures
    if (!isValidInput(name, subject, message, emailResult)) {
      const validationError = SecurityEvent.fromRequest(
        req,
        "VALIDATION_FAILURE",
        {
          formData: { name, email, subject, message },
          failureReason: emailResult.message || "invalid_input",
          processingStep: "validation",
        }
      );
      return next(validationError);
    }

    // Build security context
    const securityData = buildSecurityData(req, {
      formData: { name, email, message, subject },
      captchaProvided: !!hcaptchaToken,
      clientData,
      step: "initial_validation",
    });

    // Analyze threat level
    const threatAnalysis = analyzeThreatLevel(
      { name, email, message, subject },
      securityData
    );

    // Log form submission attempt
    await SecurityEvent.logEvent("CONTACT_SUBMISSION", {
      ...securityData,
      threatAnalysis,
      formData: {
        name,
        email,
        hasMessage: !!message,
        hasSubject: !!subject,
      },
    });

    // Check for CAPTCHA token
    if (!hcaptchaToken) {
      const captchaError = SecurityEvent.fromRequest(req, "MISSING_CAPTCHA", {
        threatAnalysis,
        failureReason: "missing_captcha",
        processingStep: "captcha_validation",
      });
      return next(captchaError);
    }

    // Verify CAPTCHA
    const captchaValid = await verifyHCaptcha(hcaptchaToken);
    if (!captchaValid) {
      const captchaError = SecurityEvent.fromRequest(req, "CAPTCHA_FAILED", {
        threatAnalysis,
        failureReason: "captcha_verification_failed",
        processingStep: "captcha_validation",
      });
      return next(captchaError);
    }

    // Block high-threat submissions
    if (threatAnalysis.level === "high") {
      await SecurityEvent.create("THREAT_BLOCKED", {
        ...securityData,
        threatAnalysis,
        action: "blocked_high_threat",
        processingStep: "threat_analysis",
      });

      // Still show success to user to avoid revealing blocking
      res.customRedirect("/contact/thankyou");
      return;
    }

    // Prepare and send email
    const emailData = prepareEmail(
      { name, email, message, subject },
      threatAnalysis
    );

    try {
      await sendContactMail(emailData);

      // Log successful processing
      await SecurityEvent.logEvent("CONTACT_SUCCESS", {
        ...securityData,
        threatAnalysis,
        processingResult: "success",
        emailSent: true,
      });

      res.customRedirect("/contact/thankyou");
    } catch (emailError) {
      // Log email sending failure
      const emailFailureEvent = SecurityEvent.fromRequest(
        req,
        "CONTACT_ERROR",
        {
          ...securityData,
          threatAnalysis,
          error: {
            message: emailError.message,
            stack: emailError.stack,
            name: emailError.name,
          },
          processingStep: "email_sending",
        }
      );

      return next(emailFailureEvent);
    }
  } catch (err) {
    // Log any unhandled errors
    const systemError = SecurityEvent.fromRequest(req, "CONTACT_ERROR", {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      processingStep: "error_handling",
    });

    next(systemError);
  }
};

module.exports.renderContactForm = async (req, res) => {
  // Log page access
  await SecurityEvent.logAccess(req, {
    page: "contact_form",
    userAgent: req.get("User-Agent"),
    referrer: req.get("Referrer"),
  });

  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Contact",
    formAction: qualifyLink("/contact"),
    formMethod: "POST",
  };

  res.renderWithBaseContext("pages/contact.handlebars", context);
};

module.exports.renderThankYouPage = async (req, res) => {
  // Log thank you page access
  await SecurityEvent.logAccess(req, {
    page: "thankyou_page",
    userAgent: req.get("User-Agent"),
    referrer: req.get("Referrer"),
  });

  res.renderGenericMessage({
    title: "Thank You",
    message:
      "Your message has been sent successfully. We will get back to you shortly.",
  });
};
